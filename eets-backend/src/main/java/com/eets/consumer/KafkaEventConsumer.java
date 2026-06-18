package com.eets.consumer;

import com.eets.config.KafkaTopicConfig;
import com.eets.dto.event.AnalyticsEvent;
import com.eets.dto.event.NotificationEvent;
import com.eets.dto.event.OrderEvent;
import com.eets.dto.event.PaymentEvent;
import com.eets.service.CacheService;
import com.eets.service.KafkaEventProducer;
import com.eets.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class KafkaEventConsumer {

    private final NotificationService notificationService;
    private final CacheService cacheService;
    private final KafkaEventProducer kafkaEventProducer;
    private final StringRedisTemplate redis;

    private boolean isDuplicateEvent(String eventId) {
        if (eventId == null || eventId.isBlank()) {
            return false;
        }
        String key = "kafka:processed:" + eventId;
        Boolean isNew = redis.opsForValue().setIfAbsent(key, "processed", java.time.Duration.ofDays(1));
        boolean isDuplicate = isNew == null || !isNew;

        boolean active = org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive();
        boolean syncActive = org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive();
        log.info("isDuplicateEvent eventId={}, isDuplicate={}, txActive={}, syncActive={}", eventId, isDuplicate, active, syncActive);

        if (!isDuplicate && syncActive) {
            log.info("Registering transaction synchronization to evict key {} on rollback", key);
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                new org.springframework.transaction.support.TransactionSynchronization() {
                    @Override
                    public void afterCompletion(int status) {
                        log.info("afterCompletion status={} for key {}", status, key);
                        if (status == STATUS_ROLLED_BACK) {
                            try {
                                redis.delete(key);
                                log.info("Evicted processed key {} from Redis due to transaction rollback", key);
                            } catch (Exception e) {
                                log.error("Failed to evict processed key {} from Redis on rollback", key, e);
                            }
                        }
                    }
                }
            );
        }
        return isDuplicate;
    }

    @KafkaListener(topics = KafkaTopicConfig.ORDER_CREATED, groupId = "eets-group")
    public void consumeOrderCreated(OrderEvent event) {
        log.info("Received OrderEvent on topic={} eventId={} orderId={}", KafkaTopicConfig.ORDER_CREATED, event.getEventId(), event.getOrderId());
        if (isDuplicateEvent(event.getEventId())) {
            log.warn("Duplicate event detected, skipping eventId={}", event.getEventId());
            return;
        }
        // Route to analytics
        AnalyticsEvent analyticsEvent = AnalyticsEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType("ORDER_CREATED")
                .orderId(event.getOrderId())
                .userId(event.getUserId())
                .amount(event.getTotalAmount())
                .timestamp(Instant.now())
                .build();
        kafkaEventProducer.sendAnalyticsEvent(analyticsEvent);
    }

    @KafkaListener(topics = KafkaTopicConfig.ORDER_ASSIGNED, groupId = "eets-group")
    public void consumeOrderAssigned(OrderEvent event) {
        log.info("Received OrderEvent on topic={} eventId={} orderId={}", KafkaTopicConfig.ORDER_ASSIGNED, event.getEventId(), event.getOrderId());
        if (isDuplicateEvent(event.getEventId())) {
            log.warn("Duplicate event detected, skipping eventId={}", event.getEventId());
            return;
        }
        // Route to analytics
        AnalyticsEvent analyticsEvent = AnalyticsEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType("ORDER_ASSIGNED")
                .orderId(event.getOrderId())
                .userId(event.getUserId())
                .amount(event.getTotalAmount())
                .timestamp(Instant.now())
                .build();
        kafkaEventProducer.sendAnalyticsEvent(analyticsEvent);
    }

    @KafkaListener(topics = KafkaTopicConfig.ORDER_PICKED_UP, groupId = "eets-group")
    public void consumeOrderPickedUp(OrderEvent event) {
        log.info("Received OrderEvent on topic={} eventId={} orderId={}", KafkaTopicConfig.ORDER_PICKED_UP, event.getEventId(), event.getOrderId());
        if (isDuplicateEvent(event.getEventId())) {
            log.warn("Duplicate event detected, skipping eventId={}", event.getEventId());
            return;
        }
        // Route to analytics
        AnalyticsEvent analyticsEvent = AnalyticsEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType("ORDER_PICKED_UP")
                .orderId(event.getOrderId())
                .userId(event.getUserId())
                .amount(event.getTotalAmount())
                .timestamp(Instant.now())
                .build();
        kafkaEventProducer.sendAnalyticsEvent(analyticsEvent);
    }

    @KafkaListener(topics = KafkaTopicConfig.ORDER_DELIVERED, groupId = "eets-group")
    public void consumeOrderDelivered(OrderEvent event) {
        log.info("Received OrderEvent on topic={} eventId={} orderId={}", KafkaTopicConfig.ORDER_DELIVERED, event.getEventId(), event.getOrderId());
        if (isDuplicateEvent(event.getEventId())) {
            log.warn("Duplicate event detected, skipping eventId={}", event.getEventId());
            return;
        }
        // Route to analytics
        AnalyticsEvent analyticsEvent = AnalyticsEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType("ORDER_DELIVERED")
                .orderId(event.getOrderId())
                .userId(event.getUserId())
                .amount(event.getTotalAmount())
                .timestamp(Instant.now())
                .build();
        kafkaEventProducer.sendAnalyticsEvent(analyticsEvent);
    }

    @KafkaListener(topics = KafkaTopicConfig.PAYMENT_SUCCESS, groupId = "eets-group")
    public void consumePaymentSuccess(PaymentEvent event) {
        log.info("Received PaymentEvent on topic={} eventId={} orderId={}", KafkaTopicConfig.PAYMENT_SUCCESS, event.getEventId(), event.getOrderId());
        if (isDuplicateEvent(event.getEventId())) {
            log.warn("Duplicate event detected, skipping eventId={}", event.getEventId());
            return;
        }
        // Route to analytics
        AnalyticsEvent analyticsEvent = AnalyticsEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType("PAYMENT_SUCCESS")
                .orderId(event.getOrderId())
                .userId(event.getUserId())
                .amount(event.getAmount())
                .timestamp(Instant.now())
                .build();
        kafkaEventProducer.sendAnalyticsEvent(analyticsEvent);
    }

    @KafkaListener(topics = KafkaTopicConfig.PAYMENT_FAILED, groupId = "eets-group")
    public void consumePaymentFailed(PaymentEvent event) {
        log.info("Received PaymentEvent on topic={} eventId={} orderId={}", KafkaTopicConfig.PAYMENT_FAILED, event.getEventId(), event.getOrderId());
        if (isDuplicateEvent(event.getEventId())) {
            log.warn("Duplicate event detected, skipping eventId={}", event.getEventId());
            return;
        }
        // Route to analytics
        AnalyticsEvent analyticsEvent = AnalyticsEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType("PAYMENT_FAILED")
                .orderId(event.getOrderId())
                .userId(event.getUserId())
                .amount(event.getAmount())
                .timestamp(Instant.now())
                .build();
        kafkaEventProducer.sendAnalyticsEvent(analyticsEvent);
    }

    @KafkaListener(topics = KafkaTopicConfig.NOTIFICATION_EVENTS, groupId = "eets-group")
    public void consumeNotificationEvent(NotificationEvent event) {
        log.info("Received NotificationEvent on topic={} eventId={} userId={} type={}",
                KafkaTopicConfig.NOTIFICATION_EVENTS, event.getEventId(), event.getUserId(), event.getType());
        if (isDuplicateEvent(event.getEventId())) {
            log.warn("Duplicate event detected, skipping eventId={}", event.getEventId());
            return;
        }
        // Call internal send method of NotificationService
        notificationService.sendInternal(event);
    }

    @KafkaListener(topics = KafkaTopicConfig.ANALYTICS_EVENTS, groupId = "eets-group")
    public void consumeAnalyticsEvent(AnalyticsEvent event) {
        log.info("Received AnalyticsEvent on topic={} eventId={} type={}",
                KafkaTopicConfig.ANALYTICS_EVENTS, event.getEventId(), event.getEventType());
        if (isDuplicateEvent(event.getEventId())) {
            log.warn("Duplicate event detected, skipping eventId={}", event.getEventId());
            return;
        }
        // Evict analytics cache asynchronously
        cacheService.evictAnalytics();
    }
}
