package com.eets.service;

import com.eets.domain.Address;
import com.eets.domain.AssignmentStatus;
import com.eets.domain.DeliveryAssignment;
import com.eets.domain.Order;
import com.eets.dto.response.EtaPayload;
import com.eets.repository.AddressRepository;
import com.eets.repository.DeliveryAssignmentRepository;
import com.eets.repository.OrderRepository;
import com.eets.util.HaversineUtil;
import com.eets.websocket.OrderSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EtaService {

    @Value("${eets.delivery.average-speed-kmh:30}")
    private double averageSpeedKmh;

    private final DeliveryAssignmentRepository assignmentRepository;
    private final OrderRepository orderRepository;
    private final AddressRepository addressRepository;
    private final com.eets.repository.RestaurantRepository restaurantRepository;
    private final OrderSocketService orderSocketService;
    private final GoogleMapsService googleMapsService;

    /**
     * Called on every driver location update (throttled).
     * Finds the active assignment, calls Google Maps to calculate the optimized
     * remaining route & ETA, persists them on Order & Assignment, and broadcasts.
     */
    @Transactional
    public Integer recalculateAndBroadcast(Long orderId, double driverLat, double driverLng) {
        // Find active assignment for this order
        Optional<DeliveryAssignment> assignmentOpt = assignmentRepository.findByOrderId(orderId);
        if (assignmentOpt.isEmpty()) {
            log.debug("No assignment found for orderId={}, skipping ETA recalc", orderId);
            return null;
        }

        DeliveryAssignment assignment = assignmentOpt.get();
        // Only recalculate for in-progress deliveries
        if (!isActiveStatus(assignment.getStatus())) {
            log.debug("Assignment {} has terminal status {}, skipping ETA recalc", assignment.getId(), assignment.getStatus());
            return null;
        }

        // Load order
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            log.warn("Order {} not found during ETA recalc", orderId);
            return null;
        }

        // Load delivery address coordinates
        Address deliveryAddress = addressRepository.findById(order.getDeliveryAddressId()).orElse(null);
        if (deliveryAddress == null || deliveryAddress.getLat() == null || deliveryAddress.getLng() == null) {
            log.warn("Delivery address missing coordinates for order {}", orderId);
            return null;
        }

        // Retrieve remaining route info using GoogleMapsService
        GoogleMapsService.RouteInfo routeInfo;
        if (assignment.getStatus() == AssignmentStatus.ACCEPTED) {
            // Driver is going to the restaurant first
            com.eets.domain.Restaurant restaurant = restaurantRepository.findById(order.getRestaurantId()).orElse(null);
            if (restaurant == null || restaurant.getLat() == null || restaurant.getLng() == null) {
                log.warn("Restaurant missing coordinates for order {}", orderId);
                return null;
            }
            routeInfo = googleMapsService.getOptimizedRoute(
                    driverLat, driverLng,
                    restaurant.getLat(), restaurant.getLng(),
                    deliveryAddress.getLat(), deliveryAddress.getLng()
            );
        } else {
            // Driver already picked up the food and is going to the customer
            routeInfo = googleMapsService.getDirectRoute(driverLat, driverLng, deliveryAddress.getLat(), deliveryAddress.getLng());
        }

        int etaMinutes = Math.max(1, (int) Math.ceil(routeInfo.durationSeconds() / 60.0));

        // Estimated delivery timestamp
        Instant estimatedDeliveryAt = Instant.now().plusSeconds(routeInfo.durationSeconds());
        LocalDateTime estimatedDeliveryLocalDt = LocalDateTime.ofInstant(estimatedDeliveryAt, ZoneOffset.UTC);

        // Persist on Order
        order.setEstimatedDeliveryAt(estimatedDeliveryAt);
        orderRepository.save(order);

        // Persist remaining path details on Assignment
        assignment.setDistanceKm(routeInfo.distanceKm());
        assignment.setEstimatedDurationMin(etaMinutes);
        assignment.setRoutePolyline(routeInfo.polyline());
        assignment.setRouteDistanceKm(routeInfo.distanceKm());
        assignment.setRouteGeneratedAt(Instant.now());
        assignmentRepository.save(assignment);

        log.debug("Order {} ETA recalculated: {}km → {}min, estimatedDeliveryAt={}",
                orderId, String.format("%.2f", routeInfo.distanceKm()), etaMinutes, estimatedDeliveryAt);

        // Broadcast via WebSocket to /topic/orders/{orderId}/eta
        EtaPayload payload = new EtaPayload(orderId, etaMinutes, estimatedDeliveryLocalDt);
        orderSocketService.broadcastEta(orderId, payload);

        return etaMinutes;
    }

    public Integer getCachedEta(Long orderId) {
        return orderRepository.findById(orderId).map(order -> {
            if (order.getEstimatedDeliveryAt() == null) {
                return 0;
            }
            long diffSeconds = order.getEstimatedDeliveryAt().getEpochSecond() - Instant.now().getEpochSecond();
            return Math.max(1, (int) Math.ceil(diffSeconds / 60.0));
        }).orElse(0);
    }

    private boolean isActiveStatus(AssignmentStatus status) {
        return status == AssignmentStatus.ACCEPTED || status == AssignmentStatus.PICKED_UP;
    }
}
