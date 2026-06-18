package com.eets.dto.response;

import java.util.List;
import java.util.Map;
public record OrderAnalyticsResponse(long totalOrders, Map<String, Long> byStatus,
    List<DailyOrders> dailySeries, List<PeakHour> peakHours, double avgDeliveryTime) {
    public record DailyOrders(String date, long count, long cancelled) {}
    public record PeakHour(int hour, long count) {}
}
