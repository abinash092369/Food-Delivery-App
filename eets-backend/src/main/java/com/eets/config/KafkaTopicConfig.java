package com.eets.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    public static final String ORDER_CREATED = "order-created";
    public static final String ORDER_ASSIGNED = "order-assigned";
    public static final String ORDER_PICKED_UP = "order-picked-up";
    public static final String ORDER_DELIVERED = "order-delivered";
    public static final String PAYMENT_SUCCESS = "payment-success";
    public static final String PAYMENT_FAILED = "payment-failed";
    public static final String NOTIFICATION_EVENTS = "notification-events";
    public static final String ANALYTICS_EVENTS = "analytics-events";

    @Bean
    public NewTopic orderCreatedTopic() {
        return TopicBuilder.name(ORDER_CREATED)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic orderAssignedTopic() {
        return TopicBuilder.name(ORDER_ASSIGNED)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic orderPickedUpTopic() {
        return TopicBuilder.name(ORDER_PICKED_UP)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic orderDeliveredTopic() {
        return TopicBuilder.name(ORDER_DELIVERED)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic paymentSuccessTopic() {
        return TopicBuilder.name(PAYMENT_SUCCESS)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic paymentFailedTopic() {
        return TopicBuilder.name(PAYMENT_FAILED)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic notificationEventsTopic() {
        return TopicBuilder.name(NOTIFICATION_EVENTS)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic analyticsEventsTopic() {
        return TopicBuilder.name(ANALYTICS_EVENTS)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic notificationDlqTopic() {
        return TopicBuilder.name(NOTIFICATION_EVENTS + ".DLQ")
                .partitions(3)
                .replicas(1)
                .build();
    }
}
