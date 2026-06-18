package com.eets.dto.response;

import java.math.BigDecimal;
import java.util.List;
public record RevenueAnalyticsResponse(BigDecimal totalRevenue, BigDecimal netRevenue, BigDecimal totalRefunds,
    List<DailyRevenue> dailySeries, List<TopRestaurant> topRestaurants, BigDecimal avgOrderValue) {
    public record DailyRevenue(String date, BigDecimal gross, BigDecimal net, BigDecimal refunds) {}
    public record TopRestaurant(String name, BigDecimal revenue) {}
}
