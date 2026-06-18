package com.eets.scheduler;

import com.eets.util.OrderNumberGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OrderNumberResetScheduler {
    private final OrderNumberGenerator gen;
    @Scheduled(cron = "0 0 0 * * *")
    public void resetMidnight() { gen.resetDaily(); }
}
