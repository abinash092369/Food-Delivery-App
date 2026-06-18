package com.eets.util;

import java.time.*;
import java.time.format.DateTimeFormatter;

public final class DateUtil {
    private DateUtil() {}
    public static final DateTimeFormatter ORDER_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");
    public static Instant startOfToday() { return LocalDate.now(ZoneOffset.UTC).atStartOfDay(ZoneOffset.UTC).toInstant(); }
    public static Instant startOfDaysAgo(int days) { return LocalDate.now(ZoneOffset.UTC).minusDays(days).atStartOfDay(ZoneOffset.UTC).toInstant(); }
}
