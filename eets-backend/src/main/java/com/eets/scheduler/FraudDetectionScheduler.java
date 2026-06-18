package com.eets.scheduler;

import com.eets.service.FraudService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FraudDetectionScheduler {
    private final FraudService fraudService;

    @Scheduled(cron = "${eets.fraud.check-interval-cron}")
    public void runDetection() { fraudService.runDetection(); }
}
