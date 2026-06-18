package com.eets.service;

import com.eets.config.KafkaTopicConfig;
import com.eets.dto.event.AnalyticsEvent;
import com.eets.dto.event.NotificationEvent;
import com.eets.dto.event.OrderEvent;
import com.eets.dto.event.PaymentEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @org.springframework.beans.factory.annotation.Value("${eets.kafka.enabled:false}")
    private boolean kafkaEnabled;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private CacheService cacheService;

    private void sendEvent(String topic, String key, Object event) {
        if (!kafkaEnabled) {
            log.info("Kafka is disabled. Skipping event publication to topic={} with key={}", topic, key);
            return;
        }
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive()) {
            kafkaTemplate.send(topic, key, event);
        } else {
            kafkaTemplate.executeInTransaction(t -> {
                t.send(topic, key, event);
                return null;
            });
        }
    }

    public void sendOrderEvent(String topic, OrderEvent event) {
        log.info("Publishing OrderEvent to topic={} eventId={} orderId={} status={}",
                topic, event.getEventId(), event.getOrderId(), event.getStatus());
        sendEvent(topic, event.getOrderId().toString(), event);
    }

    public void sendPaymentEvent(String topic, PaymentEvent event) {
        log.info("Publishing PaymentEvent to topic={} eventId={} orderId={} status={}",
                topic, event.getEventId(), event.getOrderId(), event.getStatus());
        sendEvent(topic, event.getOrderId().toString(), event);
    }

    public void sendNotificationEvent(NotificationEvent event) {
        log.info("Publishing NotificationEvent to topic={} eventId={} userId={} type={}",
                KafkaTopicConfig.NOTIFICATION_EVENTS, event.getEventId(), event.getUserId(), event.getType());
        String key = event.getUserId() != null ? event.getUserId().toString() : event.getEventId();
        sendEvent(KafkaTopicConfig.NOTIFICATION_EVENTS, key, event);
    }

    public void sendAnalyticsEvent(AnalyticsEvent event) {
        log.info("Publishing AnalyticsEvent to topic={} eventId={} orderId={} type={}",
                KafkaTopicConfig.ANALYTICS_EVENTS, event.getEventId(), event.getOrderId(), event.getEventType());
        String key = event.getOrderId() != null ? event.getOrderId().toString() : event.getEventId();
        if (!kafkaEnabled) {
            log.info("Kafka is disabled. Evicting analytics cache directly.");
            try {
                cacheService.evictAnalytics();
            } catch (Exception e) {
                log.error("Failed to directly evict analytics cache: {}", e.getMessage(), e);
            }
            return;
        }
        sendEvent(KafkaTopicConfig.ANALYTICS_EVENTS, key, event);
    }
}
