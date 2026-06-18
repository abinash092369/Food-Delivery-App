package com.eets.service;

import com.eets.domain.*;
import com.eets.dto.response.DeliveryResponse;
import com.eets.exception.*;
import com.eets.repository.*;
import com.eets.util.HaversineUtil;
import com.eets.websocket.*;
import com.eets.dto.event.OrderEvent;
import com.eets.config.KafkaTopicConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.Duration;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DeliveryService {
    private static final SecureRandom RND = new SecureRandom();

    @Value("${eets.delivery.search-radius-km}") private double radiusKm;
    @Value("${eets.commission.driver-base-fee}") private BigDecimal baseFee;
    @Value("${eets.commission.driver-per-km}") private BigDecimal perKm;
    @Value("${eets.delivery.assignment-retry-interval-min:2}") private int retryIntervalMin;
    @Value("${eets.delivery.max-assignment-retries:5}") private int maxRetries;

    private final DeliveryPartnerRepository drivers;
    private final DeliveryAssignmentRepository assignments;
    private final OrderRepository orders;
    private final RestaurantRepository restaurants;
    private final UserRepository users;
    private final AddressRepository addresses;
    private final DriverSocketService driverSocket;
    private final OrderSocketService orderSocket;
    private final NotificationService notificationService;
    private final org.springframework.data.redis.core.StringRedisTemplate redis;
    private final PaymentService paymentService;
    private final GoogleMapsService googleMapsService;
    private final KafkaEventProducer kafkaEventProducer;
    private final AdminSocketService adminSocket;

    @Value("${eets.delivery.default-driver-operating-radius-km:10.0}")
    private double defaultDriverOperatingRadiusKm;

    @Value("${eets.delivery.max-nearby-drivers:10}")
    private int maxNearbyDrivers;

    private void publishOrderEvent(String topic, Order order) {
        try {
            OrderEvent event = OrderEvent.builder()
                    .eventId(UUID.randomUUID().toString())
                    .orderId(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .status(order.getStatus())
                    .userId(order.getUserId())
                    .restaurantId(order.getRestaurantId())
                    .totalAmount(order.getTotalAmount())
                    .paymentMethod(order.getPaymentMethod())
                    .paymentStatus(order.getPaymentStatus())
                    .timestamp(Instant.now())
                    .build();
            kafkaEventProducer.sendOrderEvent(topic, event);
        } catch (Exception e) {
            log.error("Failed to publish order event to topic={} for orderId={}: {}", topic, order.getId(), e.getMessage(), e);
        }
    }

    @org.springframework.scheduling.annotation.Async
    public void assignDeliveryAsync(Long orderId) {
        log.info("Triggering delivery assignment async for orderId={}", orderId);
        try {
            assignDelivery(orderId);
        } catch (Exception e) {
            log.error("Failed async delivery assignment for orderId={}: {}", orderId, e.getMessage(), e);
        }
    }

    public DeliveryAssignment assignDelivery(Long orderId) {
        log.info("[BACKEND TRACE] Starting delivery assignment for orderId={}", orderId);
        Order o = orders.findById(orderId).orElseThrow(() -> {
            log.error("[BACKEND TRACE] Order not found for assignment: orderId={}", orderId);
            return new ResourceNotFoundException("Order not found");
        });
        Restaurant r = restaurants.findById(o.getRestaurantId()).orElseThrow();
        if (r.getLat() == null || r.getLng() == null) {
            log.warn("[BACKEND TRACE] Restaurant {} missing coordinates - cannot assign", r.getId());
            return null;
        }

        Address addr = addresses.findById(o.getDeliveryAddressId()).orElse(null);
        double customerLat = addr != null && addr.getLat() != null ? addr.getLat() : r.getLat();
        double customerLng = addr != null && addr.getLng() != null ? addr.getLng() : r.getLng();

        List<Double> searchRadii = List.of(2.0, 5.0, 10.0, 15.0, 20.0);
        List<DeliveryPartner> available = new ArrayList<>();
        Map<Long, Double> driverDistanceMap = new HashMap<>();

        // Progressive search
        for (double currentRadiusKm : searchRadii) {
            available.clear();
            driverDistanceMap.clear();
            log.info("[BACKEND TRACE] Searching drivers at radius={}km", currentRadiusKm);
            try {
                org.springframework.data.geo.Distance radiusDist = new org.springframework.data.geo.Distance(currentRadiusKm, org.springframework.data.redis.connection.RedisGeoCommands.DistanceUnit.KILOMETERS);
                org.springframework.data.geo.GeoResults<org.springframework.data.redis.connection.RedisGeoCommands.GeoLocation<String>> results = redis.opsForGeo().search(
                    "drivers:locations",
                    org.springframework.data.redis.domain.geo.GeoReference.fromCoordinate(r.getLng(), r.getLat()),
                    radiusDist,
                    org.springframework.data.redis.connection.RedisGeoCommands.GeoSearchCommandArgs.newGeoSearchArgs().includeDistance().sortAscending()
                );

                if (results != null) {
                    List<Long> driverIds = new ArrayList<>();
                    for (org.springframework.data.geo.GeoResult<org.springframework.data.redis.connection.RedisGeoCommands.GeoLocation<String>> res : results.getContent()) {
                        Long dId = Long.valueOf(res.getContent().getName());
                        driverIds.add(dId);
                        driverDistanceMap.put(dId, res.getDistance().getValue());
                    }
                    log.info("[BACKEND TRACE] Redis GEOSEARCH found {} drivers nearby: {}", driverIds.size(), driverIds);
                    if (!driverIds.isEmpty()) {
                        List<DeliveryPartner> dbDrivers = drivers.findAllById(driverIds);
                        for (DeliveryPartner d : dbDrivers) {
                            if (Boolean.TRUE.equals(d.getIsOnline()) && Boolean.TRUE.equals(d.getIsVerified())) {
                                User u = users.findById(d.getUserId()).orElse(null);
                                if (u != null && Boolean.TRUE.equals(u.getIsActive()) && !Boolean.TRUE.equals(u.getIsBanned())) {
                                    double dist = driverDistanceMap.getOrDefault(d.getId(), HaversineUtil.km(r.getLat(), r.getLng(), d.getCurrentLat(), d.getCurrentLng()));
                                    double opRadius = d.getOperatingRadiusKm() != null ? d.getOperatingRadiusKm() : defaultDriverOperatingRadiusKm;
                                    log.info("[BACKEND TRACE] Redis Candidate evaluation: driverId={} | distance={}km | operatingRadius={}km", d.getId(), dist, opRadius);
                                    if (dist <= opRadius) {
                                        available.add(d);
                                        log.info("[DRIVER_ASSIGNMENT_CHECK] orderId={} driverId={}", orderId, d.getId());
                                    }
                                } else {
                                    log.info("[BACKEND TRACE] Redis Candidate skipped (banned/inactive): driverId={} | userId={}", d.getId(), d.getUserId());
                                }
                            } else {
                                log.info("[BACKEND TRACE] Redis Candidate skipped (offline/unverified): driverId={}", d.getId());
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.error("[BACKEND TRACE] Redis GEOSEARCH failed in assignDelivery, falling back to database query: {}", e.getMessage());
                double radiusMeters = currentRadiusKm * 1000;
                List<DeliveryPartner> dbDrivers = drivers.findAvailableDriversNearby(r.getLat(), r.getLng(), radiusMeters);
                log.info("[BACKEND TRACE] Database driver fallback query found {} drivers nearby", dbDrivers.size());
                for (DeliveryPartner d : dbDrivers) {
                    if (d.getCurrentLat() != null && d.getCurrentLng() != null) {
                        double dist = HaversineUtil.km(r.getLat(), r.getLng(), d.getCurrentLat(), d.getCurrentLng());
                        double opRadius = d.getOperatingRadiusKm() != null ? d.getOperatingRadiusKm() : defaultDriverOperatingRadiusKm;
                        log.info("[BACKEND TRACE] DB Candidate evaluation: driverId={} | distance={}km | operatingRadius={}km", d.getId(), dist, opRadius);
                        if (dist <= opRadius) {
                            available.add(d);
                            driverDistanceMap.put(d.getId(), dist);
                            log.info("[DRIVER_ASSIGNMENT_CHECK] orderId={} driverId={}", orderId, d.getId());
                        }
                    }
                }
            }

            if (!available.isEmpty()) {
                log.info("[BACKEND TRACE] Found {} suitable drivers at radius {}km", available.size(), currentRadiusKm);
                break;
            }
        }

        // Fallback to any online, verified, active, non-banned driver if no nearby driver found
        if (available.isEmpty()) {
            log.info("[BACKEND TRACE] No nearby driver found. Performing fallback to find any online, verified, active, non-banned driver.");
            List<DeliveryPartner> allOnlineVerified = drivers.findByIsOnlineTrueAndIsVerifiedTrue();
            for (DeliveryPartner d : allOnlineVerified) {
                User u = users.findById(d.getUserId()).orElse(null);
                if (u != null && Boolean.TRUE.equals(u.getIsActive()) && !Boolean.TRUE.equals(u.getIsBanned())) {
                    available.add(d);
                    if (d.getCurrentLat() != null && d.getCurrentLng() != null) {
                        driverDistanceMap.put(d.getId(), HaversineUtil.km(r.getLat(), r.getLng(), d.getCurrentLat(), d.getCurrentLng()));
                    } else {
                        driverDistanceMap.put(d.getId(), 0.0);
                    }
                    log.info("[DRIVER_ASSIGNMENT_CHECK] orderId={} driverId={}", orderId, d.getId());
                }
            }
        }

        log.info("Candidate count before assignment: {}", available.size());

        // Limit to top N nearest available drivers before applying assignment scoring
        available.sort(Comparator.comparingDouble(d -> driverDistanceMap.getOrDefault(d.getId(), 0.0)));
        List<DeliveryPartner> topNDrivers = available.stream().limit(maxNearbyDrivers).toList();

        record Candidate(DeliveryPartner d, double dist, long workload, double score) {}
        List<Candidate> ranked = new ArrayList<>();
        for (DeliveryPartner d : topNDrivers) {
            double dist = driverDistanceMap.getOrDefault(d.getId(), d.getCurrentLat() != null && d.getCurrentLng() != null ? HaversineUtil.km(r.getLat(), r.getLng(), d.getCurrentLat(), d.getCurrentLng()) : 0.0);
            long workload = assignments.countByDriverIdAndStatus(d.getId(), AssignmentStatus.ACCEPTED)
                + assignments.countByDriverIdAndStatus(d.getId(), AssignmentStatus.PICKED_UP);

            double rating = d.getAvgRating() != null ? d.getAvgRating() : 0.0;
            double acceptanceRate = d.getAcceptanceRate() != null ? d.getAcceptanceRate() : 1.0;
            double completionRate = d.getCompletionRate() != null ? d.getCompletionRate() : 1.0;

            // Score calculation: higher rating/rates are better, closer/fewer workloads are better
            double score = (rating * 10.0)
                         - (dist * 5.0)
                         + (acceptanceRate * 20.0)
                         + (completionRate * 20.0)
                         - (workload * 15.0);

            log.info("[BACKEND TRACE] Ranked candidate score details: driverId={} | rating={} | distance={} | workload={} | score={}",
                d.getId(), rating, dist, workload, score);
            ranked.add(new Candidate(d, dist, workload, score));
        }

        // Sort candidates by score descending
        ranked.sort((c1, c2) -> Double.compare(c2.score, c1.score));

        if (ranked.isEmpty()) { 
            log.warn("[BACKEND TRACE] No driver found for order {}", orderId); 
            log.info("[DRIVER_ASSIGNMENT_CHECK] orderId: {}, restaurant coordinates: ({}, {}), delivery address coordinates: ({}, {}), available online drivers count: 0, selected driverId: null, assignment saved: no",
                orderId, r.getLat(), r.getLng(), customerLat, customerLng);
            log.warn("[DRIVER_ASSIGNMENT_FAILED] orderId={} driverId=null (No driver found)", orderId);
            o.setDeliveryPartnerId(null);
            orders.save(o);
            return null; 
        }
        DeliveryPartner chosen = ranked.get(0).d;
        log.info("[BACKEND TRACE] Selected driver for orderId={} is driverId={} (userId={}) with score={}", 
            orderId, chosen.getId(), chosen.getUserId(), ranked.get(0).score);

        // Generate optimized route from driver -> restaurant -> customer using Google Directions API
        double driverLat = chosen.getCurrentLat() != null ? chosen.getCurrentLat() : r.getLat();
        double driverLng = chosen.getCurrentLng() != null ? chosen.getCurrentLng() : r.getLng();

        log.info("[BACKEND TRACE] Requesting route optimization from driver location ({}, {}) -> restaurant ({}, {}) -> customer ({}, {})",
            driverLat, driverLng, r.getLat(), r.getLng(), customerLat, customerLng);

        GoogleMapsService.RouteInfo routeInfo = googleMapsService.getOptimizedRoute(
            driverLat, driverLng,
            r.getLat(), r.getLng(),
            customerLat, customerLng
        );

        BigDecimal earnings = baseFee.add(perKm.multiply(BigDecimal.valueOf(routeInfo.distanceKm()))).setScale(2, RoundingMode.HALF_UP);
        log.info("[BACKEND TRACE] Route distance={}}km, duration={}s, computed earnings=₹{}", 
            routeInfo.distanceKm(), routeInfo.durationSeconds(), earnings);

        assignments.findByOrderId(orderId).ifPresent(existing -> {
            log.info("[BACKEND TRACE] Removing existing assignment for orderId={}", orderId);
            assignments.delete(existing);
            assignments.flush();
        });

        // Update order.deliveryPartnerId
        o.setDeliveryPartnerId(chosen.getId());
        orders.save(o);

        DeliveryAssignment a = DeliveryAssignment.builder()
            .orderId(orderId).driverId(chosen.getId())
            .status(AssignmentStatus.ASSIGNED).assignedAt(Instant.now())
            .pickupOtp(String.format("%04d", RND.nextInt(10000)))
            .deliveryOtp(String.format("%04d", RND.nextInt(10000)))
            .distanceKm(routeInfo.distanceKm())
            .estimatedDurationMin((int) Math.max(1, Math.ceil(routeInfo.durationSeconds() / 60.0)))
            .routePolyline(routeInfo.polyline())
            .routeDistanceKm(routeInfo.distanceKm())
            .routeGeneratedAt(Instant.now())
            .earningsAmount(earnings).build();
        a = assignments.save(a);
        log.info("[BACKEND TRACE] DeliveryAssignment persisted in DB | assignmentId={} | status={}", a.getId(), a.getStatus());

        log.info("[DRIVER_ASSIGNMENT_CREATED] orderId={} driverId={} assignmentId={}", orderId, chosen.getId(), a.getId());

        String assignmentSaved = (a != null && a.getId() != null) ? "yes" : "no";
        log.info("[DRIVER_ASSIGNMENT_CHECK] orderId: {}, restaurant coordinates: ({}, {}), delivery address coordinates: ({}, {}), available online drivers count: {}, selected driverId: {}, assignment saved: {}",
            orderId,
            r.getLat(), r.getLng(),
            customerLat, customerLng,
            available.size(),
            chosen.getId(),
            assignmentSaved);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("event", "new_delivery_assignment");
        payload.put("deliveryId", a.getId());
        payload.put("orderId", orderId);

        Map<String, Object> restaurantMap = new LinkedHashMap<>();
        restaurantMap.put("name", r.getName() != null ? r.getName() : "");
        restaurantMap.put("address", r.getAddressLine() != null ? r.getAddressLine() : "");
        restaurantMap.put("lat", r.getLat());
        restaurantMap.put("lng", r.getLng());
        payload.put("restaurant", restaurantMap);

        Map<String, Object> customerMap = new LinkedHashMap<>();
        customerMap.put("address", addr != null && addr.getAddressLine() != null ? addr.getAddressLine() : "");
        customerMap.put("lat", addr != null ? addr.getLat() : null);
        customerMap.put("lng", addr != null ? addr.getLng() : null);
        payload.put("customer", customerMap);

        payload.put("distance", routeInfo.distanceKm());
        payload.put("durationMinutes", a.getEstimatedDurationMin());
        payload.put("routePolyline", a.getRoutePolyline() != null ? a.getRoutePolyline() : "");
        payload.put("routeDistanceKm", a.getRouteDistanceKm());
        payload.put("routeGeneratedAt", a.getRouteGeneratedAt() != null ? a.getRouteGeneratedAt().toString() : "");
        payload.put("earning", earnings);
        payload.put("pickupOtp", a.getPickupOtp());
        
        try {
            driverSocket.sendAssignmentToDriver(chosen.getId(), payload);
            log.info("[BACKEND TRACE] Sent WS message new_delivery_assignment to driverId={}", chosen.getId());
        } catch (Exception e) {
            log.error("[BACKEND TRACE] Failed to send WS new_delivery_assignment to driverId={}: {}", chosen.getId(), e.getMessage());
        }

        try {
            notificationService.send(chosen.getUserId(), "New delivery", "Order " + o.getOrderNumber() + " awaits acceptance", "DELIVERY_ASSIGNED", orderId);
            log.info("[BACKEND TRACE] Sent push notification to driver userId={} for delivery offer", chosen.getUserId());
        } catch (Exception e) {
            log.error("[BACKEND TRACE] Failed to send push notification to driver userId={}: {}", chosen.getUserId(), e.getMessage());
        }
        return a;
    }

    public DeliveryResponse acceptAssignment(Long driverUserId, Long assignmentId) {
        log.info("[DRIVER_ASSIGNMENT_ACCEPT_REQUEST] driverUserId={} assignmentId={}", driverUserId, assignmentId);
        DeliveryAssignment a = assignments.findById(assignmentId).orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        DeliveryPartner driver = drivers.findByUserId(driverUserId).orElseThrow();
        if (!a.getDriverId().equals(driver.getId())) throw new UnauthorizedException("Not your assignment");

        log.info("[DRIVER_ASSIGNMENT_ACCEPTED] orderId={} driverId={}", a.getOrderId(), driver.getId());

        a.setStatus(AssignmentStatus.ACCEPTED);
        a.setAcceptedAt(Instant.now());
        assignments.save(a);
        Order o = orders.findByIdForUpdate(a.getOrderId()).orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        o.setDeliveryPartnerId(driver.getId());
        o.setStatus(OrderStatus.PICKED_UP);
        orders.saveAndFlush(o);
        publishOrderEvent(KafkaTopicConfig.ORDER_ASSIGNED, o);
        redis.delete("delivery:retry:count:" + o.getId());
        User driverUser = users.findById(driverUserId).orElseThrow();
        orderSocket.broadcastStatusUpdate(o.getId(),
            Map.of("event", "status_updated", "status", "PICKED_UP"));
        orderSocket.broadcastStatusUpdate(o.getId(),
            Map.of("event", "driver_assigned", "driverName", driverUser.getName(),
                "vehicleType", driver.getVehicleType() == null ? "" : driver.getVehicleType().name(),
                "rating", driver.getAvgRating() == null ? 0 : driver.getAvgRating()));

        try {
            Restaurant r = restaurants.findById(o.getRestaurantId()).orElse(null);
            adminSocket.broadcastNewOrder(Map.of(
                "orderId", o.getId(),
                "amount", o.getTotalAmount(),
                "restaurant", r == null ? "" : r.getName(),
                "customer", o.getUserId().toString(),
                "status", o.getStatus().name()
            ));
            log.info("[BACKEND TRACE] Broadcasted driver assignment/status update to admin for orderId={}", o.getId());
        } catch (Exception e) {
            log.error("[BACKEND TRACE] Failed to broadcast status update to admin for orderId={}: {}", o.getId(), e.getMessage());
        }

        log.info("[DRIVER_ASSIGNMENT_ACCEPT_SUCCESS] driverUserId={} assignmentId={}", driverUserId, assignmentId);
        return toDto(a, o);
    }

    public void rejectAssignment(Long driverUserId, Long assignmentId, String reason) {
        DeliveryAssignment a = assignments.findById(assignmentId).orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        DeliveryPartner driver = drivers.findByUserId(driverUserId).orElseThrow();
        if (!a.getDriverId().equals(driver.getId())) throw new UnauthorizedException("Not your assignment");

        log.warn("[DRIVER_ASSIGNMENT_FAILED] orderId={} driverId={} (Rejected by driver)", a.getOrderId(), driver.getId());

        a.setStatus(AssignmentStatus.REJECTED);
        a.setRejectionReason(reason);
        assignments.save(a);

        String retryKey = "delivery:retry:count:" + a.getOrderId();
        redis.opsForValue().increment(retryKey);

        reassignOrEscalate(a.getOrderId());
    }

    public DeliveryResponse updateStatus(Long driverUserId, Long assignmentId, String status, String otp) {
        DeliveryAssignment a = assignments.findById(assignmentId).orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        DeliveryPartner driver = drivers.findByUserId(driverUserId).orElseThrow();
        if (!a.getDriverId().equals(driver.getId())) throw new UnauthorizedException("Not your assignment");
        Order o = orders.findByIdForUpdate(a.getOrderId()).orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        switch (status) {
            case "PICKED_UP" -> {
                if (otp == null || !otp.equals(a.getPickupOtp())) throw new BadRequestException("Invalid pickup OTP");
                a.setStatus(AssignmentStatus.PICKED_UP);
                a.setPickedUpAt(Instant.now());
                o.setStatus(OrderStatus.ON_THE_WAY);
                orders.saveAndFlush(o);
                publishOrderEvent(KafkaTopicConfig.ORDER_PICKED_UP, o);
                orderSocket.broadcastStatusUpdate(o.getId(), Map.of("event", "status_updated", "status", "ON_THE_WAY"));
                notificationService.send(o.getUserId(), "Order on the way", "Your order " + o.getOrderNumber() + " is out for delivery", "ORDER_STATUS", o.getId());
            }
            case "DELIVERED" -> {
                if (otp == null || !otp.equals(a.getDeliveryOtp())) throw new BadRequestException("Invalid delivery OTP");
                a.setStatus(AssignmentStatus.DELIVERED);
                a.setDeliveredAt(Instant.now());
                o.setStatus(OrderStatus.DELIVERED);
                o.setDeliveredAt(Instant.now());
                orders.saveAndFlush(o);
                publishOrderEvent(KafkaTopicConfig.ORDER_DELIVERED, o);
                driver.setTotalDeliveries((driver.getTotalDeliveries() == null ? 0 : driver.getTotalDeliveries()) + 1);
                drivers.save(driver);
                orderSocket.broadcastStatusUpdate(o.getId(), Map.of("event", "order_delivered"));
                notificationService.send(o.getUserId(), "Order delivered", "Enjoy your meal!", "ORDER_DELIVERED", o.getId());
            }
            default -> throw new BadRequestException("Unsupported status transition");
        }
        assignments.save(a);
        return toDto(a, o);
    }

    public void reassignOrEscalate(Long orderId) {
        String retryKey = "delivery:retry:count:" + orderId;
        String retryStr = redis.opsForValue().get(retryKey);
        int retries = retryStr == null ? 0 : Integer.parseInt(retryStr);
        if (retries >= maxRetries) {
            log.warn("Max retries reached for order {} in reassignOrEscalate. Cancelling.", orderId);
            Order o = orders.findById(orderId).orElseThrow();
            o.setStatus(OrderStatus.CANCELLED);
            o.setCancellationReason("No driver available");
            orders.save(o);
            publishOrderEvent(KafkaTopicConfig.ORDER_CREATED, o);

            if (o.getPaymentMethod() != PaymentMethod.COD && o.getPaymentStatus() == PaymentStatus.PAID) {
                try {
                    paymentService.refund(o.getRazorpayPaymentId(), o.getTotalAmount());
                    o.setPaymentStatus(PaymentStatus.REFUNDED);
                    o.setRefundAmount(o.getTotalAmount());
                } catch (Exception refundEx) {
                    log.error("Failed to refund orderId={} during escalation: {}", orderId, refundEx.getMessage());
                }
            }

            notificationService.send(o.getUserId(), "Order cancelled", "No driver available for order " + o.getOrderNumber(), "ORDER_CANCELLED", o.getId());
            orderSocket.broadcastStatusUpdate(o.getId(), Map.of("event", "status_updated", "status", "CANCELLED"));
            return;
        }

        DeliveryAssignment fresh = assignDelivery(orderId);
        if (fresh == null) log.warn("Escalating: no driver for order {}", orderId);
    }

    public void retryUnassignedOrders() {
        log.info("[BACKEND TRACE] Running retryUnassignedOrders scheduler check");
        Instant timeoutTime = Instant.now().minus(Duration.ofMinutes(retryIntervalMin));
        List<DeliveryAssignment> timedOutAssignments = assignments.findByStatusAndAssignedAtBefore(AssignmentStatus.ASSIGNED, timeoutTime);
        
        for (DeliveryAssignment a : timedOutAssignments) {
            log.info("Assignment {} for order {} timed out. Reassigning.", a.getId(), a.getOrderId());
            log.warn("[DRIVER_ASSIGNMENT_FAILED] orderId={} driverId={} (Timeout)", a.getOrderId(), a.getDriverId());
            
            a.setStatus(AssignmentStatus.CANCELLED);
            assignments.save(a);

            // Set order deliveryPartnerId back to null
            orders.findById(a.getOrderId()).ifPresent(o -> {
                o.setDeliveryPartnerId(null);
                orders.save(o);
            });

            String retryKey = "delivery:retry:count:" + a.getOrderId();
            redis.opsForValue().increment(retryKey);

            reassignOrEscalate(a.getOrderId());
        }

        // Also check if there are any orders with status PACKED or ACCEPTED/PREPARING that have NO delivery partner and no active assignment
        List<Order> needyOrders = orders.findUnassignedOrders();
        for (Order o : needyOrders) {
            boolean hasActiveAssignment = assignments.findByOrderId(o.getId())
                .map(a -> a.getStatus() == AssignmentStatus.ASSIGNED || a.getStatus() == AssignmentStatus.ACCEPTED || a.getStatus() == AssignmentStatus.PICKED_UP)
                .orElse(false);
            if (!hasActiveAssignment) {
                log.info("[BACKEND TRACE] Order {} needs driver assignment. Assigning.", o.getId());
                assignDelivery(o.getId());
            }
        }
    }

    public DeliveryResponse toDto(DeliveryAssignment a, Order o) {
        return new DeliveryResponse(a.getId(), a.getOrderId(), o == null ? null : o.getOrderNumber(),
            a.getStatus(), a.getAssignedAt(), a.getAcceptedAt(), a.getPickedUpAt(), a.getDeliveredAt(),
            a.getPickupOtp(), a.getDeliveryOtp(), a.getDistanceKm(), a.getEarningsAmount(),
            a.getRoutePolyline(), a.getEstimatedDurationMin(), a.getRouteDistanceKm(), a.getRouteGeneratedAt());
    }
}
