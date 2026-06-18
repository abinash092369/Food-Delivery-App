package com.eets.dto.response;

import java.math.BigDecimal;
import java.util.List;
public record VendorEarningsResponse(BigDecimal totalEarnings, BigDecimal commissionRate,
    BigDecimal commissionAmount, BigDecimal netEarnings, long totalOrders,
    List<DaySeries> dailySeries, List<TopDish> topDishes) {
    public record DaySeries(String date, BigDecimal gross, BigDecimal net, long orders) {}
    public record TopDish(String name, long orders, BigDecimal revenue) {}
}
