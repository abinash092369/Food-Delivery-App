package com.eets.dto.response;

import java.math.BigDecimal;
public record AdminDashboardMetrics(BigDecimal revenueToday, long ordersToday,
    long newUsersToday, long activeOrders, long activeRestaurants, long activeDrivers) {}
