package com.eets.scheduler;

import com.eets.service.DeliveryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DeliveryAssignmentScheduler {
    private final DeliveryService deliveryService;

    @Scheduled(fixedDelayString = "#{${eets.delivery.assignment-retry-interval-min} * 60 * 1000}")
    public void retryUnassigned() {
        try {
            deliveryService.retryUnassignedOrders();
        } catch (Exception e) {
            log.error("Failed to execute retryUnassigned scheduler check: {}", e.getMessage(), e);
        }
    }
}
