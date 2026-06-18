package com.eets.service;

import com.eets.domain.*;
import com.eets.dto.request.*;
import com.eets.dto.response.*;
import com.eets.exception.*;
import com.eets.repository.*;
import com.eets.security.JwtTokenProvider;
import com.eets.util.OrderNumberGenerator;
import com.eets.util.PageResponse;
import com.eets.websocket.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.eets.dto.event.OrderEvent;
import com.eets.dto.event.PaymentEvent;
import com.eets.config.KafkaTopicConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {
    private static final BigDecimal TAX_RATE = new BigDecimal("0.18");

    private final OrderRepository orders;
    private final OrderItemRepository orderItems;
    private final OrderStatusHistoryRepository history;
    private final CartRepository carts;
    private final CartItemRepository cartItems;
    private final MenuItemRepository menuItems;
    private final RestaurantRepository restaurants;
    private final UserRepository users;
    private final AddressRepository addresses;
    private final DeliveryAssignmentRepository assignments;
    private final DeliveryPartnerRepository drivers;
    private final OrderNumberGenerator numberGen;
    private final PaymentService paymentService;
    private final CouponService couponService;
    private final DeliveryService deliveryService;
    private final NotificationService notificationService;
    private final OrderSocketService orderSocket;
    private final AdminSocketService adminSocket;
    private final org.springframework.data.redis.core.StringRedisTemplate redis;
    private final FraudService fraudService;
    private final KafkaEventProducer kafkaEventProducer;
    private final OrderAsyncService orderAsyncService;
    private final ObjectMapper json = new ObjectMapper();

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

    private void publishPaymentEvent(String topic, Order order, String paymentId, String status, String errorMsg) {
        try {
            PaymentEvent event = PaymentEvent.builder()
                    .eventId(UUID.randomUUID().toString())
                    .orderId(order.getId())
                    .paymentId(paymentId)
                    .amount(order.getTotalAmount())
                    .status(status)
                    .userId(order.getUserId())
                    .errorMessage(errorMsg)
                    .timestamp(Instant.now())
                    .build();
            kafkaEventProducer.sendPaymentEvent(topic, event);
        } catch (Exception e) {
            log.error("Failed to publish payment event to topic={} for orderId={}: {}", topic, order.getId(), e.getMessage(), e);
        }
    }

    @org.springframework.beans.factory.annotation.Value("${eets.delivery.default-restaurant-radius-km:5.0}")
    private double defaultRestaurantRadiusKm;

    public InitiateOrderResponse initiate(Long userId, InitiateOrderRequest req) {
        Cart cart = carts.findByUserId(userId).orElseThrow(() -> new BadRequestException("Cart empty"));
        List<CartItem> items = cartItems.findByCartId(cart.getId());
        if (items.isEmpty()) throw new BadRequestException("Cart empty");
        Address addr = addresses.findById(req.addressId()).orElseThrow(() -> new BadRequestException("Address not found"));
        if (!addr.getUserId().equals(userId)) throw new UnauthorizedException("Address not yours");
        Restaurant r = restaurants.findById(cart.getRestaurantId()).orElseThrow();

        if (r.getLat() != null && r.getLng() != null && addr.getLat() != null && addr.getLng() != null) {
            double distanceToAddress = com.eets.util.HaversineUtil.km(r.getLat(), r.getLng(), addr.getLat(), addr.getLng());
            double deliveryRadius = r.getDeliveryRadiusKm() != null ? r.getDeliveryRadiusKm() : defaultRestaurantRadiusKm;
            if (distanceToAddress > deliveryRadius) {
                throw new BadRequestException("Delivery address is outside the restaurant's delivery service zone.");
            }
        }

        BigDecimal subtotal = items.stream().map(CartItem::getTotalPrice).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal deliveryFee = r.getDeliveryFee();
        BigDecimal tax = subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal discount = BigDecimal.ZERO;
        Coupon coupon = null;
        if (req.couponCode() != null && !req.couponCode().isBlank()) {
            coupon = couponService.findOrThrow(req.couponCode());
            discount = couponService.calculateDiscount(coupon, subtotal);
            if (coupon.getType() == CouponType.FREE_DELIVERY) deliveryFee = BigDecimal.ZERO;
        }
        BigDecimal total = subtotal.add(deliveryFee).add(tax).subtract(discount).max(BigDecimal.ZERO);

        Order order = Order.builder()
            .orderNumber(numberGen.next())
            .userId(userId).restaurantId(r.getId()).deliveryAddressId(addr.getId())
            .couponId(coupon == null ? null : coupon.getId())
            .status(OrderStatus.PLACED)
            .paymentMethod(req.paymentMethod())
            .paymentStatus(req.paymentMethod() == PaymentMethod.COD ? PaymentStatus.PENDING : PaymentStatus.PENDING)
            .subtotal(subtotal).deliveryFee(deliveryFee).taxAmount(tax)
            .discountAmount(discount).totalAmount(total)
            .specialInstructions(req.specialInstructions())
            .estimatedDeliveryAt(Instant.now().plusSeconds(r.getDeliveryTimeMin() * 60L))
            .build();
        order = orders.save(order);

        // snapshot items
        for (CartItem ci : items) {
            MenuItem mi = menuItems.findById(ci.getMenuItemId()).orElse(null);
            orderItems.save(OrderItem.builder()
                .orderId(order.getId()).menuItemId(ci.getMenuItemId())
                .name(mi == null ? "Item" : mi.getName())
                .quantity(ci.getQuantity()).unitPrice(ci.getItemPrice()).totalPrice(ci.getTotalPrice())
                .selectedOptions(ci.getSelectedOptions()).build());
        }
        history.save(OrderStatusHistory.builder().orderId(order.getId()).status("PLACED")
            .changedById(userId).changedAt(Instant.now()).notes("Order placed").build());

        User u = users.findById(userId).orElseThrow();
        if (Boolean.TRUE.equals(u.getIsBanned())) {
            throw new UnauthorizedException("Account banned: " + u.getBanReason());
        }

        // Offload fraud checks and Kafka creation event to background
        orderAsyncService.runPostInitiationAsync(order.getId(), userId);

        if (req.paymentMethod() == PaymentMethod.RAZORPAY) {
            PaymentService.RazorpayOrder rz = paymentService.createOrder(total, userId);
            order.setRazorpayOrderId(rz.id());
            orders.save(order);
            return new InitiateOrderResponse(order.getId(), order.getOrderNumber(),
                rz.id(), total, rz.currency(), paymentService.getKeyId(),
                new InitiateOrderResponse.Prefill(u.getName(), u.getEmail(), u.getPhone()));
        } else {
            // COD: confirm immediately
            confirmOrder(order, coupon, userId);
            return new InitiateOrderResponse(order.getId(), order.getOrderNumber(),
                null, total, "INR", null,
                new InitiateOrderResponse.Prefill(u.getName(), u.getEmail(), u.getPhone()));
        }
    }

    private String sha256Hex(String input) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 hashing failed", e);
        }
    }

    public InitiateOrderResponse initiateIdempotent(Long userId, InitiateOrderRequest req, String idempotencyKey) {
        String hash = sha256Hex(idempotencyKey);
        String key = "idem:orders:" + hash;

        String cachedVal = redis.opsForValue().get(key);
        if (cachedVal != null) {
            if ("PROCESSING".equals(cachedVal)) {
                throw new BadRequestException("Request is currently being processed. Please wait.");
            }
            try {
                return json.readValue(cachedVal, InitiateOrderResponse.class);
            } catch (Exception e) {
                log.error("Failed to deserialize cached InitiateOrderResponse", e);
            }
        }

        Boolean locked = redis.opsForValue().setIfAbsent(key, "PROCESSING", java.time.Duration.ofMinutes(2));
        if (locked == null || !locked) {
            throw new BadRequestException("Concurrent request or already processed. Please try again.");
        }

        try {
            InitiateOrderResponse response = initiate(userId, req);
            String jsonStr = json.writeValueAsString(response);
            redis.opsForValue().set(key, jsonStr, java.time.Duration.ofHours(24));
            return response;
        } catch (Exception e) {
            redis.delete(key);
            if (e instanceof RuntimeException) throw (RuntimeException) e;
            throw new RuntimeException(e);
        }
    }

    public Map<String, Object> verifyPayment(Long userId, VerifyPaymentRequest req) {
        try {
            paymentService.verifySignature(req.razorpayOrderId(), req.razorpayPaymentId(), req.razorpaySignature());
        } catch (Exception e) {
            log.error("Payment verification failed for razorpayOrderId={}", req.razorpayOrderId(), e);
            orders.findByRazorpayOrderId(req.razorpayOrderId()).ifPresent(order -> {
                order.setPaymentStatus(PaymentStatus.FAILED);
                order.setStatus(OrderStatus.CANCELLED);
                order.setCancellationReason("PAYMENT_VERIFICATION_FAILED: " + e.getMessage());
                orders.save(order);
                history.save(OrderStatusHistory.builder().orderId(order.getId()).status("CANCELLED")
                    .changedById(userId).changedAt(Instant.now()).notes("Payment verification failed: " + e.getMessage()).build());
                publishPaymentEvent(KafkaTopicConfig.PAYMENT_FAILED, order, null, "FAILED", e.getMessage());
                publishOrderEvent(KafkaTopicConfig.ORDER_CREATED, order);
            });
            paymentService.trackFailedPayment(userId);
            throw e;
        }
        Order order = orders.findByRazorpayOrderId(req.razorpayOrderId())
            .orElseThrow(() -> new BadRequestException("Order not found"));
        if (!order.getUserId().equals(userId)) throw new UnauthorizedException("Not your order");
        order.setRazorpayPaymentId(req.razorpayPaymentId());
        order.setRazorpaySignature(req.razorpaySignature());
        order.setPaymentStatus(PaymentStatus.PAID);
        orders.save(order);
        publishPaymentEvent(KafkaTopicConfig.PAYMENT_SUCCESS, order, req.razorpayPaymentId(), "SUCCESS", null);
        publishOrderEvent(KafkaTopicConfig.ORDER_CREATED, order);
        Coupon coupon = order.getCouponId() == null ? null : couponService.byId(order.getCouponId());
        confirmOrder(order, coupon, userId);
        return Map.of("orderId", order.getId(), "orderNumber", order.getOrderNumber());
    }

    private void confirmOrder(Order order, Coupon coupon, Long userId) {
        if (coupon != null) couponService.recordUsage(coupon, userId, order.getId(), order.getDiscountAmount());
        carts.findByUserId(userId).ifPresent(c -> { cartItems.deleteByCartId(c.getId()); c.setRestaurantId(null); c.setCouponId(null); carts.save(c); });
        
        // Asynchronously broadcast WebSocket updates and send push notifications
        orderAsyncService.confirmOrderAsync(order.getId(), userId);
    }

    public PageResponse<OrderResponse> userOrders(Long userId, int page, int size) {
        Page<Order> orderPage = orders.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));
        List<Long> ids = orderPage.getContent().stream().map(Order::getId).toList();
        List<OrderResponse> content = toDtoList(ids);
        Page<OrderResponse> mapped = new PageImpl<>(content, orderPage.getPageable(), orderPage.getTotalElements());
        return PageResponse.of(mapped);
    }

    public OrderResponse getOrder(Long userId, Long id) {
        Order o = orders.findById(id).orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        boolean isCustomer = o.getUserId().equals(userId);
        boolean isDriver = false;
        
        Optional<DeliveryPartner> driverOpt = drivers.findByUserId(userId);
        if (driverOpt.isPresent()) {
            DeliveryPartner dp = driverOpt.get();
            if (dp.getId().equals(o.getDeliveryPartnerId())) {
                isDriver = true;
            } else {
                isDriver = assignments.findByOrderId(id)
                    .map(a -> a.getDriverId().equals(dp.getId()))
                    .orElse(false);
            }
        }
        
        if (!isCustomer && !isDriver) {
            throw new UnauthorizedException("Not authorized to view this order");
        }
        return toDto(o);
    }

    public OrderResponse getOrderAsAdmin(Long id) {
        return toDto(orders.findById(id).orElseThrow(() -> new ResourceNotFoundException("Order not found")));
    }

    public void cancelOrder(Long userId, Long id, String reason) {
        Order o = orders.findById(id).orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!o.getUserId().equals(userId)) throw new UnauthorizedException("Not your order");
        if (!EnumSet.of(OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PREPARING).contains(o.getStatus()))
            throw new BadRequestException("Cannot cancel at this stage");
        o.setStatus(OrderStatus.CANCELLED);
        o.setCancellationReason(reason);
        if (o.getPaymentMethod() != PaymentMethod.COD && o.getPaymentStatus() == PaymentStatus.PAID) {
            paymentService.refund(o.getRazorpayPaymentId(), o.getTotalAmount());
            o.setPaymentStatus(PaymentStatus.REFUNDED);
            o.setRefundAmount(o.getTotalAmount());
            o.setStatus(OrderStatus.REFUNDED);
        }
        orders.save(o);
        publishOrderEvent(KafkaTopicConfig.ORDER_CREATED, o);
        history.save(OrderStatusHistory.builder().orderId(o.getId()).status("CANCELLED")
            .changedById(userId).changedAt(Instant.now()).notes(reason).build());
        orderSocket.broadcastOrderToRestaurant(o.getRestaurantId(),
            Map.of("event", "order_cancelled", "orderId", o.getId(), "reason", reason));
        Restaurant r = restaurants.findById(o.getRestaurantId()).orElse(null);
        if (r != null) notificationService.send(r.getOwnerId(), "Order cancelled", "Order " + o.getOrderNumber() + " was cancelled", "ORDER_CANCELLED", o.getId());
    }

    public Map<String, Object> reorder(Long userId, Long id) {
        Order o = orders.findById(id).orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!o.getUserId().equals(userId)) throw new UnauthorizedException("Not your order");
        Cart cart = carts.findByUserId(userId).orElseGet(() -> carts.save(Cart.builder().userId(userId).restaurantId(o.getRestaurantId()).build()));
        cartItems.deleteByCartId(cart.getId());
        cart.setRestaurantId(o.getRestaurantId()); cart.setCouponId(null); carts.save(cart);
        List<String> unavailable = new ArrayList<>();
        List<OrderItem> items = orderItems.findByOrderId(o.getId());
        for (OrderItem oi : items) {
            MenuItem mi = menuItems.findById(oi.getMenuItemId()).orElse(null);
            if (mi == null || !Boolean.TRUE.equals(mi.getIsAvailable())) { unavailable.add(oi.getName()); continue; }
            cartItems.save(CartItem.builder().cartId(cart.getId()).menuItemId(mi.getId())
                .quantity(oi.getQuantity()).itemPrice(oi.getUnitPrice())
                .totalPrice(oi.getUnitPrice().multiply(BigDecimal.valueOf(oi.getQuantity())))
                .selectedOptions(oi.getSelectedOptions()).build());
        }
        return Map.of("cartId", cart.getId(), "unavailableItems", unavailable);
    }

    // vendor flow
    @org.springframework.retry.annotation.Retryable(
        retryFor = { org.springframework.dao.CannotAcquireLockException.class },
        maxAttempts = 3,
        backoff = @org.springframework.retry.annotation.Backoff(delay = 500)
    )
    public OrderResponse vendorUpdateStatus(Long vendorUserId, Long orderId, OrderStatus status) {
        log.info("[BACKEND TRACE] Received vendorUpdateStatus request | vendorUserId={} | orderId={} | targetStatus={}", vendorUserId, orderId, status);
        Order o = orders.findByIdForUpdate(orderId).orElseThrow(() -> {
            log.error("[BACKEND TRACE] Order not found for orderId={}", orderId);
            return new ResourceNotFoundException("Order not found");
        });

        // Prevent multiple updates on same Order row
        if (o.getStatus() == status) {
            log.info("[BACKEND TRACE] Order status is already {}, returning immediately", status);
            return toDto(o);
        }

        if (o.getStatus() == OrderStatus.CANCELLED || o.getStatus() == OrderStatus.REFUNDED || o.getStatus() == OrderStatus.DELIVERED) {
            log.warn("[BACKEND TRACE] Order is in terminal state {}, ignoring status update to {}", o.getStatus(), status);
            return toDto(o);
        }

        if (o.getStatus().ordinal() > status.ordinal()) {
            log.info("[BACKEND TRACE] Order status {} is further along than target status {}, returning current state", o.getStatus(), status);
            return toDto(o);
        }

        Restaurant r = restaurants.findById(o.getRestaurantId()).orElseThrow();
        if (!r.getOwnerId().equals(vendorUserId)) {
            log.error("[BACKEND TRACE] Auth mismatch: Restaurant ownerId={} does not match vendorUserId={}", r.getOwnerId(), vendorUserId);
            throw new UnauthorizedException("Not your restaurant");
        }

        o.setStatus(status);
        o = orders.saveAndFlush(o);
        log.info("[BACKEND TRACE] Order status updated in DB and flushed | orderId={} | newStatus={}", o.getId(), o.getStatus());

        final OrderStatus finalStatus = status;
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
            log.info("[BACKEND TRACE] Transaction synchronization active. Registering afterCommit callback for orderId={}", orderId);
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                new org.springframework.transaction.support.TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        log.info("[BACKEND TRACE] Transaction committed. Offloading post-status-update tasks to async.");
                        orderAsyncService.handlePostStatusUpdateAsync(orderId, finalStatus, vendorUserId);
                    }
                }
            );
        } else {
            log.warn("[BACKEND TRACE] Transaction synchronization not active. Calling async tasks immediately.");
            orderAsyncService.handlePostStatusUpdateAsync(orderId, finalStatus, vendorUserId);
        }

        return toDto(o);
    }

    public OrderResponse vendorReject(Long vendorUserId, Long orderId, String reason) {
        Order o = orders.findById(orderId).orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        Restaurant r = restaurants.findById(o.getRestaurantId()).orElseThrow();
        if (!r.getOwnerId().equals(vendorUserId)) throw new UnauthorizedException("Not your restaurant");
        o.setStatus(OrderStatus.CANCELLED);
        o.setCancellationReason(reason);
        if (o.getPaymentMethod() != PaymentMethod.COD && o.getPaymentStatus() == PaymentStatus.PAID) {
            // Asynchronously process the refund
            orderAsyncService.refundAsync(o.getRazorpayPaymentId(), o.getTotalAmount());
            o.setPaymentStatus(PaymentStatus.REFUNDED);
            o.setStatus(OrderStatus.REFUNDED);
            o.setRefundAmount(o.getTotalAmount());
        }
        orders.save(o);
        publishOrderEvent(KafkaTopicConfig.ORDER_CREATED, o);
        history.save(OrderStatusHistory.builder().orderId(o.getId()).status("CANCELLED")
            .changedById(vendorUserId).changedAt(Instant.now()).notes(reason).build());
        notificationService.send(o.getUserId(), "Order rejected", reason, "ORDER_REJECTED", o.getId());
        return toDto(o);
    }

    public String adminRefund(Long orderId, BigDecimal amount, String reason) {
        Order o = orders.findById(orderId).orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (o.getPaymentMethod() == PaymentMethod.COD) {
            o.setCodRefundPending(true);
            o.setRefundAmount(amount);
            o.setRefundReason(reason);
            orders.save(o);
            publishOrderEvent(KafkaTopicConfig.ORDER_CREATED, o);
            return "manual_refund_required";
        }
        paymentService.refund(o.getRazorpayPaymentId(), amount);
        o.setRefundAmount(amount); o.setRefundReason(reason);
        o.setPaymentStatus(PaymentStatus.REFUNDED);
        orders.save(o);
        publishOrderEvent(KafkaTopicConfig.ORDER_CREATED, o);
        notificationService.send(o.getUserId(), "Refund initiated", "₹" + amount + " refund for " + o.getOrderNumber(), "REFUND", o.getId());
        return "refunded";
    }

    public OrderResponse toDto(Order o) {
        List<OrderResponse> content = toDtoList(List.of(o.getId()));
        if (content.isEmpty()) {
            throw new ResourceNotFoundException("Order not found");
        }
        return content.get(0);
    }

    public List<OrderResponse> toDtoList(List<Long> orderIds) {
        if (orderIds == null || orderIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<Order> orderList = orders.findAllById(orderIds);
        Map<Long, Order> orderMap = orderList.stream().collect(Collectors.toMap(Order::getId, ord -> ord));
        List<Order> sortedOrders = orderIds.stream()
            .map(orderMap::get)
            .filter(Objects::nonNull)
            .toList();
        return toDtoListFromOrders(sortedOrders);
    }

    public List<OrderResponse> toDtoListFromOrders(List<Order> orderList) {
        if (orderList == null || orderList.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> orderIds = orderList.stream().map(Order::getId).toList();
        List<Long> restaurantIds = orderList.stream().map(Order::getRestaurantId).filter(Objects::nonNull).distinct().toList();
        List<Long> addressIds = orderList.stream().map(Order::getDeliveryAddressId).filter(Objects::nonNull).distinct().toList();
        List<Long> driverIds = orderList.stream().map(Order::getDeliveryPartnerId).filter(Objects::nonNull).distinct().toList();

        // 1. Bulk load items
        List<OrderItem> allItems = orderItems.findByOrderIdIn(orderIds);
        Map<Long, List<OrderItem>> itemsByOrderId = allItems.stream()
                .collect(Collectors.groupingBy(OrderItem::getOrderId));

        // 2. Bulk load status history
        List<OrderStatusHistory> allHistory = history.findByOrderIdIn(orderIds);
        Map<Long, List<OrderStatusHistory>> histByOrderId = allHistory.stream()
                .sorted(Comparator.comparing(OrderStatusHistory::getChangedAt))
                .collect(Collectors.groupingBy(OrderStatusHistory::getOrderId));

        // 3. Bulk load restaurants
        Map<Long, Restaurant> restMap = restaurantIds.isEmpty() ? Collections.emptyMap() :
                restaurants.findAllById(restaurantIds).stream()
                        .collect(Collectors.toMap(Restaurant::getId, r -> r));

        // 4. Bulk load addresses
        Map<Long, Address> addrMap = addressIds.isEmpty() ? Collections.emptyMap() :
                addresses.findAllById(addressIds).stream()
                        .collect(Collectors.toMap(Address::getId, a -> a));

        // 5. Bulk load drivers and their user info
        Map<Long, DeliveryPartner> driverMap = Collections.emptyMap();
        Map<Long, User> driverUserMap = Collections.emptyMap();
        if (!driverIds.isEmpty()) {
            List<DeliveryPartner> allDrivers = drivers.findAllById(driverIds);
            driverMap = allDrivers.stream().collect(Collectors.toMap(DeliveryPartner::getId, d -> d));
            List<Long> driverUserIds = allDrivers.stream().map(DeliveryPartner::getUserId).filter(Objects::nonNull).distinct().toList();
            if (!driverUserIds.isEmpty()) {
                driverUserMap = users.findAllById(driverUserIds).stream().collect(Collectors.toMap(User::getId, u -> u));
            }
        }

        final Map<Long, DeliveryPartner> finalDriverMap = driverMap;
        final Map<Long, User> finalDriverUserMap = driverUserMap;

        return orderList.stream().map(o -> {
            List<OrderItem> items = itemsByOrderId.getOrDefault(o.getId(), Collections.emptyList());
            List<OrderItemResponse> itemDtos = items.stream().map(i ->
                new OrderItemResponse(i.getId(), i.getMenuItemId(), i.getName(), i.getQuantity(),
                    i.getUnitPrice(), i.getTotalPrice(), i.getSelectedOptions())).toList();

            List<OrderStatusHistory> histList = histByOrderId.getOrDefault(o.getId(), Collections.emptyList());
            List<OrderStatusHistoryResponse> hist = histList.stream()
                .map(h -> new OrderStatusHistoryResponse(h.getStatus(), h.getChangedAt(), h.getNotes())).toList();

            Restaurant r = restMap.get(o.getRestaurantId());
            Address a = addrMap.get(o.getDeliveryAddressId());
            AddressResponse addrDto = a == null ? null : new AddressResponse(a.getId(), a.getLabel(),
                a.getAddressLine(), a.getCity(), a.getState(), a.getPincode(), a.getLat(), a.getLng(), a.getIsDefault());

            OrderResponse.DriverInfo driverInfo = null;
            if (o.getDeliveryPartnerId() != null) {
                DeliveryPartner dp = finalDriverMap.get(o.getDeliveryPartnerId());
                if (dp != null) {
                    User du = finalDriverUserMap.get(dp.getUserId());
                    driverInfo = new OrderResponse.DriverInfo(dp.getId(),
                        du == null ? null : du.getName(), du == null ? null : du.getPhone(),
                        dp.getVehicleType() == null ? null : dp.getVehicleType().name(), dp.getAvgRating());
                }
            }

            return new OrderResponse(o.getId(), o.getOrderNumber(), o.getStatus(), o.getPaymentMethod(),
                o.getPaymentStatus(), o.getSubtotal(), o.getDeliveryFee(), o.getTaxAmount(),
                o.getDiscountAmount(), o.getTotalAmount(), o.getSpecialInstructions(),
                o.getEstimatedDeliveryAt(), o.getDeliveredAt(), o.getCreatedAt(),
                o.getRestaurantId(), r == null ? null : r.getName(), r == null ? null : r.getAddressLine(),
                addrDto, itemDtos, hist, driverInfo);
        }).toList();
    }

    public PageResponse<OrderResponse> toDtoPage(Page<Order> page) {
        List<OrderResponse> content = toDtoListFromOrders(page.getContent());
        Page<OrderResponse> mapped = new PageImpl<>(content, page.getPageable(), page.getTotalElements());
        return PageResponse.of(mapped);
    }
}
