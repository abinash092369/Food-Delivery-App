package com.eets.dto.response;

import java.math.BigDecimal;
import java.util.List;
public record DriverEarningsResponse(int deliveriesToday, BigDecimal earningsToday,
    int deliveriesThisWeek, BigDecimal earningsThisWeek,
    List<DaySeries> dailySeries, Incentive incentiveProgress) {
    public record DaySeries(String date, int deliveries, BigDecimal earnings) {}
    public record Incentive(int target, int current, BigDecimal bonusAmount) {}
}
