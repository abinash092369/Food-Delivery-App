package com.eets.service;

import com.eets.config.KafkaTopicConfig;
import com.eets.domain.*;
import com.eets.dto.event.NotificationEvent;
import com.eets.dto.event.OrderEvent;
import com.eets.dto.event.PaymentEvent;
import com.eets.repository.NotificationRepository;
import com.eets.repository.OrderRepository;
import org.apache.kafka.clients.consumer.Consumer;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.test.EmbeddedKafkaBroker;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.kafka.test.utils.KafkaTestUtils;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import java.util.concurrent.ConcurrentHashMap;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.any;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK, properties = {"spring.kafka.listener.auto-startup=true", "eets.kafka.enabled=true"})
@EmbeddedKafka(
        partitions = 1,
        brokerProperties = {
                "listeners=PLAINTEXT://localhost:9092",
                "port=9092",
                "transaction.state.log.replication.factor=1",
                "transaction.state.log.min.isr=1"
        }
)
@ActiveProfiles("test")
@DirtiesContext
public class KafkaIntegrationTest {

    @Autowired
    private EmbeddedKafkaBroker embeddedKafkaBroker;

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Autowired
    private KafkaEventProducer kafkaEventProducer;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private OrderRepository orderRepository;

    @MockBean
    private StringRedisTemplate redis;

    @MockBean
    private CacheService cacheService;

    private final Map<String, String> fakeRedisMap = new ConcurrentHashMap<>();

    private Consumer<String, Object> dlqConsumer;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        fakeRedisMap.clear();

        // Stub redis.opsForValue()
        ValueOperations<String, String> valueOps = mock(ValueOperations.class);
        when(redis.opsForValue()).thenReturn(valueOps);

        // Stub setIfAbsent
        when(valueOps.setIfAbsent(anyString(), anyString(), any(java.time.Duration.class)))
                .thenAnswer(invocation -> {
                    String key = invocation.getArgument(0);
                    String val = invocation.getArgument(1);
                    return fakeRedisMap.putIfAbsent(key, val) == null;
                });

        // Stub hasKey
        when(redis.hasKey(anyString())).thenAnswer(invocation -> {
            String key = invocation.getArgument(0);
            return fakeRedisMap.containsKey(key);
        });

        // Stub delete
        when(redis.delete(anyString())).thenAnswer(invocation -> {
            String key = invocation.getArgument(0);
            return fakeRedisMap.remove(key) != null;
        });

        // Setup DLQ consumer
        Map<String, Object> consumerProps = new HashMap<>(KafkaTestUtils.consumerProps("dlq-test-group", "true", embeddedKafkaBroker));
        consumerProps.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        consumerProps.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        consumerProps.put(JsonDeserializer.TRUSTED_PACKAGES, "*");
        
        DefaultKafkaConsumerFactory<String, Object> cf = new DefaultKafkaConsumerFactory<>(consumerProps);
        dlqConsumer = cf.createConsumer();
        dlqConsumer.subscribe(Collections.singletonList("notification-events.DLQ"));
    }

    @AfterEach
    void tearDown() {
        if (dlqConsumer != null) {
            dlqConsumer.close();
        }
    }

    @Test
    public void testNotificationAsynchronousDeliveryAndIdempotency() throws Exception {
        NotificationEvent event = NotificationEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .userId(1L)
                .title("Order Confirmed")
                .body("Your order has been enqueued")
                .type("ORDER_CREATED")
                .referenceId(123L)
                .timestamp(Instant.now())
                .build();

        // Send notification event
        kafkaEventProducer.sendNotificationEvent(event);

        // Wait for asynchronous consumer to persist notification
        int retries = 30;
        while (notificationRepository.count() == 0 && retries-- > 0) {
            TimeUnit.MILLISECONDS.sleep(200);
        }

        assertThat(notificationRepository.count()).isEqualTo(1);
        Notification notification = notificationRepository.findAll().get(0);
        assertThat(notification.getTitle()).isEqualTo("Order Confirmed");
        assertThat(notification.getBody()).isEqualTo("Your order has been enqueued");

        // Send the duplicate event (idempotency check)
        kafkaEventProducer.sendNotificationEvent(event);
        TimeUnit.SECONDS.sleep(2);

        // Count should still be 1 (duplicate skipped)
        assertThat(notificationRepository.count()).isEqualTo(1);
    }

    @Test
    public void testDLQRoutingOnFailure() throws Exception {
        NotificationEvent dlqEvent = NotificationEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .userId(1L)
                .title("TRIGGER_DLQ") // Trigger forced exception
                .body("Must end up in DLQ")
                .type("TEST_DLQ")
                .referenceId(999L)
                .timestamp(Instant.now())
                .build();

        kafkaEventProducer.sendNotificationEvent(dlqEvent);

        // Assert message lands in DLQ
        ConsumerRecord<String, Object> record = KafkaTestUtils.getSingleRecord(dlqConsumer, "notification-events.DLQ", java.time.Duration.ofSeconds(10));
        assertThat(record).isNotNull();
        
        // Assert deserialized payload properties
        NotificationEvent value = (NotificationEvent) record.value();
        assertThat(value.getTitle()).isEqualTo("TRIGGER_DLQ");
        assertThat(value.getBody()).isEqualTo("Must end up in DLQ");
    }

    @Test
    public void testOrderAndPaymentEventsRoutingToAnalytics() throws Exception {
        // Publish Order created event
        OrderEvent orderEvent = OrderEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .orderId(12345L)
                .orderNumber("ORD-999")
                .status(OrderStatus.PLACED)
                .userId(1L)
                .restaurantId(10L)
                .totalAmount(new BigDecimal("500.00"))
                .paymentMethod(PaymentMethod.COD)
                .paymentStatus(PaymentStatus.PENDING)
                .timestamp(Instant.now())
                .build();

        kafkaEventProducer.sendOrderEvent(KafkaTopicConfig.ORDER_CREATED, orderEvent);

        // Publish Payment success event
        PaymentEvent paymentEvent = PaymentEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .orderId(12345L)
                .paymentId("pay_abc")
                .amount(new BigDecimal("500.00"))
                .status("SUCCESS")
                .userId(1L)
                .timestamp(Instant.now())
                .build();

        kafkaEventProducer.sendPaymentEvent(KafkaTopicConfig.PAYMENT_SUCCESS, paymentEvent);

        // Wait for asynchronous consumers to process both keys
        int retries = 50;
        while ((!fakeRedisMap.containsKey("kafka:processed:" + orderEvent.getEventId())
                || !fakeRedisMap.containsKey("kafka:processed:" + paymentEvent.getEventId()))
                && retries-- > 0) {
            TimeUnit.MILLISECONDS.sleep(200);
        }

        System.out.println("DEBUG fakeRedisMap keys after wait: " + fakeRedisMap.keySet());

        // Verify redis logs processed keys for idempotency
        assertThat(redis.hasKey("kafka:processed:" + orderEvent.getEventId())).isTrue();
        assertThat(redis.hasKey("kafka:processed:" + paymentEvent.getEventId())).isTrue();
    }
}
