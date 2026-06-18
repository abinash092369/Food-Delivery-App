package com.eets.dto.response;

import java.util.List;
public record UserAnalyticsResponse(long totalUsers, long newUsers, long activeUsers,
    List<DailyUsers> dailyNewUsers, double retentionRate) {
    public record DailyUsers(String date, long count) {}
}
