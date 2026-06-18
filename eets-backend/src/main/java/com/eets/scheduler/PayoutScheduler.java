package com.eets.scheduler;

import com.eets.service.PayoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PayoutScheduler {
    private final PayoutService payoutService;

    // Every Monday at 02:00 UTC
    @Scheduled(cron = "0 0 2 * * MON")
    public void weeklyPayouts() { payoutService.runWeeklyPayouts(); }
}
