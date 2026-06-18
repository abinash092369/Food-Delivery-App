package com.eets.util;

import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class OrderNumberGenerator {
    private final AtomicLong sequence = new AtomicLong(0);
    private volatile LocalDate currentDay = LocalDate.now();

    public synchronized String next() {
        LocalDate today = LocalDate.now();
        if (!today.equals(currentDay)) { currentDay = today; sequence.set(0); }
        long n = sequence.incrementAndGet();
        return "EETS-" + today.format(DateUtil.ORDER_DATE) + "-" + String.format("%05d", n);
    }
    public void resetDaily() { sequence.set(0); currentDay = LocalDate.now(); }
}
