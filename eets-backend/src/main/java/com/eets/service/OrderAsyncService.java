package com.eets.service;

import com.eets.domain.*;
import com.eets.repository.*;
import com.eets.websocket.*;
import com.eets.config.KafkaTopicConfig;
import com.eets.dto.event.OrderEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderAsyncService {

    private final OrderRepository orders;
    private final UserRepository users;
    private final RestaurantRepository restaurants;
    private final FraudService fraudService;
    private final OrderSocketService orderSocket;
    private final AdminSocketService adminSocket;
    private final NotificationService notificationService;
    private final KafkaEventProducer kafkaEventProducer;
    private final PaymentService paymentService;
    private final OrderStatusHistoryRepository history;
    private final DeliveryService deliveryService;

    @Async
    @Transactional
    public void runPostInitiationAsync(Long orderId, Long userId) {
        log.info("Running post-initiation tasks async for orderId={}, userId={}", orderId, userId);
        try {
            Order order = orders.findById(orderId).orElse(null);
            if (order == null) {
                log.warn("Order not found for async post-initiation: orderId={}", orderId);
                return;
            }

            // 1. Run real-time fraud checks
            try {
                fraudService.runRealTimeCheck(userId, order);
            } catch (Exception e) {
                log.error("Error in async fraud check for orderId={}: {}", orderId, e.getMessage(), e);
            }

            // 2. Publish order event
            try {
                publishOrderEvent(KafkaTopicConfig.ORDER_CREATED, order);
            } catch (Exception e) {
                log.error("Error publishing ORDER_CREATED event async for orderId={}: {}", orderId, e.getMessage(), e);
            }
        } catch (Exception e) {
            log.error("Failed post-initiation async tasks for orderId={}: {}", orderId, e.getMessage(), e);
        }
    }

    @Async
    @Transactional
    public void confirmOrderAsync(Long orderId, Long userId) {
        log.info("Running confirmOrder async for orderId={}, userId={}", orderId, userId);
        try {
            Order order = orders.findById(orderId).orElse(null);
            if (order == null) {
                log.warn("Order not found for async confirmOrder: orderId={}", orderId);
                return;
            }

            Restaurant r = restaurants.findById(order.getRestaurantId()).orElse(null);
            User u = users.findById(userId).orElse(null);

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("event", "order_received");
            payload.put("orderId", order.getId());
            payload.put("orderNumber", order.getOrderNumber());
            payload.put("total", order.getTotalAmount());
            payload.put("customerName", u == null ? "" : u.getName());

            // WebSocket broadcasts
            orderSocket.broadcastOrderToRestaurant(order.getRestaurantId(), payload);
            adminSocket.broadcastNewOrder(Map.of(
                "orderId", order.getId(),
                "amount", order.getTotalAmount(),
                "restaurant", r == null ? "" : r.getName(),
                "customer", u == null ? "" : u.getName()
            ));

            // Notification to restaurant owner
            if (r != null) {
                notificationService.send(r.getOwnerId(), "New order!", "Order " + order.getOrderNumber() + " received", "NEW_ORDER", order.getId());
            }
        } catch (Exception e) {
            log.error("Failed in confirmOrderAsync for orderId={}: {}", orderId, e.getMessage(), e);
        }
    }

    @Async
    @Transactional
    public void refundAsync(String paymentId, BigDecimal amount) {
        log.info("Running refund async for paymentId={}, amount={}", paymentId, amount);
        try {
            paymentService.refund(paymentId, amount);
        } catch (Exception e) {
            log.error("Failed async refund for paymentId={}: {}", paymentId, e.getMessage(), e);
        }
    }

    @Async
    @Transactional
    public void handlePostStatusUpdateAsync(Long orderId, OrderStatus status, Long vendorUserId) {
        log.info("[ASYNC TRACE] Starting post-status-update tasks for orderId={}, status={}, vendorUserId={}", orderId, status, vendorUserId);
        try {
            Order o = orders.findById(orderId).orElse(null);
            if (o == null) {
                log.warn("[ASYNC TRACE] Order not found for async post-status-update tasks: orderId={}", orderId);
                return;
            }

            // 1. Save history status update
            try {
                history.save(OrderStatusHistory.builder()
                        .orderId(o.getId())
                        .status(status.name())
                        .changedById(vendorUserId)
                        .changedAt(Instant.now())
                        .build());
                log.info("[ASYNC TRACE] Saved order status history for orderId={}, status={}", orderId, status);
            } catch (Exception e) {
                log.error("[ASYNC TRACE] Failed to save order status history for orderId={}: {}", orderId, e.getMessage());
            }

            // 2. Publish Kafka events
            try {
                if (status == OrderStatus.ACCEPTED) {
                    publishOrderEvent(KafkaTopicConfig.ORDER_ASSIGNED, o);
                } else {
                    publishOrderEvent(KafkaTopicConfig.ORDER_CREATED, o);
                }
                log.info("[ASYNC TRACE] Published Kafka event for orderId={}, status={}", orderId, status);
            } catch (Exception e) {
                log.error("[ASYNC TRACE] Failed to publish order event for orderId={}: {}", orderId, e.getMessage());
            }

            // 3. WebSockets
            try {
                orderSocket.broadcastStatusUpdate(o.getId(),
                    Map.of("event", "status_updated", "status", status.name()));
                log.info("[ASYNC TRACE] Broadcasted status_updated to customer for orderId={}", o.getId());
            } catch (Exception e) {
                log.error("[ASYNC TRACE] Failed to broadcast status update to customer for orderId={}: {}", o.getId(), e.getMessage());
            }

            try {
                orderSocket.broadcastOrderToRestaurant(o.getRestaurantId(),
                    Map.of("event", "status_updated", "orderId", o.getId(), "status", status.name()));
                log.info("[ASYNC TRACE] Broadcasted status_updated to restaurant for orderId={}", o.getId());
            } catch (Exception e) {
                log.error("[ASYNC TRACE] Failed to broadcast status update to restaurant for orderId={}: {}", o.getId(), e.getMessage());
            }

            try {
                Restaurant r = restaurants.findById(o.getRestaurantId()).orElse(null);
                adminSocket.broadcastNewOrder(Map.of(
                    "orderId", o.getId(),
                    "amount", o.getTotalAmount(),
                    "restaurant", r == null ? "" : r.getName(),
                    "customer", o.getUserId().toString(),
                    "status", status.name()
                ));
                log.info("[ASYNC TRACE] Broadcasted status update to admin for orderId={}", o.getId());
            } catch (Exception e) {
                log.error("[ASYNC TRACE] Failed to broadcast status update to admin for orderId={}: {}", o.getId(), e.getMessage());
            }

            // 4. Notifications
            try {
                notificationService.send(o.getUserId(), "Order " + status.name().toLowerCase(),
                    "Your order " + o.getOrderNumber() + " is " + status.name(), "ORDER_STATUS", o.getId());
                log.info("[ASYNC TRACE] Sent push notification to customer userId={} for orderId={}", o.getUserId(), o.getId());
            } catch (Exception e) {
                log.error("[ASYNC TRACE] Failed to send push notification to customer for orderId={}: {}", o.getId(), e.getMessage());
            }

            // 5. Driver assignment trigger
            if (status == OrderStatus.PACKED) {
                log.info("[ASYNC TRACE] Order is PACKED, triggering driver assignment async for orderId={}", o.getId());
                try {
                    deliveryService.assignDeliveryAsync(o.getId());
                } catch (Exception e) {
                    log.error("[ASYNC TRACE] Failed to start driver assignment for orderId={}: {}", o.getId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("[ASYNC TRACE] Error in handlePostStatusUpdateAsync for orderId={}: {}", orderId, e.getMessage(), e);
        }
    }

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
}
