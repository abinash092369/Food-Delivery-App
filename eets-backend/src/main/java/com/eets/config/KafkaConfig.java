package com.eets.config;

import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.common.TopicPartition;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.kafka.KafkaProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.*;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.transaction.KafkaTransactionManager;
import org.springframework.util.backoff.FixedBackOff;
import org.springframework.context.annotation.Primary;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.orm.jpa.JpaTransactionManager;
import jakarta.persistence.EntityManagerFactory;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class KafkaConfig {

    private final KafkaProperties properties;

    @Value("${spring.kafka.listener.auto-startup:true}")
    private Boolean autoStartup;

    @Autowired(required = false)
    private MeterRegistry meterRegistry;

    @Bean
    public ProducerFactory<String, Object> producerFactory() {
        Map<String, Object> configProps = new HashMap<>(properties.buildProducerProperties(null));
        DefaultKafkaProducerFactory<String, Object> factory = new DefaultKafkaProducerFactory<>(configProps);
        
        // Transactional support if prefix is configured
        String txIdPrefix = properties.getProducer().getTransactionIdPrefix();
        if (txIdPrefix != null && !txIdPrefix.isBlank()) {
            factory.setTransactionIdPrefix(txIdPrefix);
        }

        // Monitoring with Micrometer
        if (meterRegistry != null) {
            factory.addListener(new MicrometerProducerListener<>(meterRegistry));
        }
        
        return factory;
    }

    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate(ProducerFactory<String, Object> producerFactory) {
        return new KafkaTemplate<>(producerFactory);
    }

    @Bean
    @Primary
    public PlatformTransactionManager transactionManager(EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }

    @Bean
    public KafkaTransactionManager<String, Object> kafkaTransactionManager(ProducerFactory<String, Object> producerFactory) {
        KafkaTransactionManager<String, Object> manager = new KafkaTransactionManager<>(producerFactory);
        manager.setTransactionSynchronization(org.springframework.transaction.support.AbstractPlatformTransactionManager.SYNCHRONIZATION_ON_ACTUAL_TRANSACTION);
        return manager;
    }

    @Bean
    public ConsumerFactory<String, Object> consumerFactory() {
        Map<String, Object> configProps = new HashMap<>(properties.buildConsumerProperties(null));
        DefaultKafkaConsumerFactory<String, Object> factory = new DefaultKafkaConsumerFactory<>(configProps);
        
        // Monitoring with Micrometer
        if (meterRegistry != null) {
            factory.addListener(new MicrometerConsumerListener<>(meterRegistry));
        }
        
        return factory;
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, Object> kafkaListenerContainerFactory(
            ConsumerFactory<String, Object> consumerFactory,
            KafkaTemplate<String, Object> kafkaTemplate,
            KafkaTransactionManager<String, Object> kafkaTransactionManager) {

        ConcurrentKafkaListenerContainerFactory<String, Object> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);
        factory.getContainerProperties().setTransactionManager(kafkaTransactionManager);

        if (autoStartup != null) {
            factory.setAutoStartup(autoStartup);
        }
        if (properties.getListener().getAckMode() != null) {
            factory.getContainerProperties().setAckMode(properties.getListener().getAckMode());
        }

        // DLQ & Retry configuration
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(kafkaTemplate,
                (record, exception) -> {
                    log.error("Redirecting failed message from topic={} partition={} offset={} to DLQ due to error: {}",
                            record.topic(), record.partition(), record.offset(), exception.getMessage());
                    return new TopicPartition(record.topic() + ".DLQ", record.partition());
                });

        // 3 retry attempts with a 1-second delay
        DefaultErrorHandler errorHandler = new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 3));
        factory.setCommonErrorHandler(errorHandler);

        return factory;
    }
}
