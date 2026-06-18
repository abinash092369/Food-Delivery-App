package com.eets.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

// Redis TTL auto-purges expired OTPs. This is a defensive sweep / log.
@Slf4j
@Component
@RequiredArgsConstructor
public class OtpCleanupScheduler {
    @Scheduled(fixedDelay = 3_600_000) // hourly
    public void purge() { log.debug("OTP cleanup tick (Redis handles TTL automatically)"); }
}
