package com.eets.service;

import com.eets.config.CacheConstants;
import com.eets.domain.*;
import com.eets.dto.response.*;
import com.eets.repository.*;
import com.eets.util.DateUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {
    private final OrderRepository orders;
    private final UserRepository users;
    private final RestaurantRepository restaurants;
    private final DeliveryPartnerRepository drivers;
    private final OrderItemRepository orderItems;

    @Cacheable(value = CacheConstants.ANALYTICS_METRICS)
    public AdminDashboardMetrics adminMetrics() {
        Instant today = DateUtil.startOfToday();
        BigDecimal revenue = orders.sumPaidSince(today);
        long ordersToday = orders.countByCreatedAtAfter(today);
        long newUsers = users.countByCreatedAtAfter(today);
        long active = orders.countByStatusInAndCreatedAtAfter(
            List.of(OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PREPARING,
                OrderStatus.PACKED, OrderStatus.PICKED_UP, OrderStatus.ON_THE_WAY), today.minusSeconds(86400));
        long restaurantsActive = restaurants.countByIsActiveTrue();
        long driversActive = drivers.countByIsOnlineTrue();
        return new AdminDashboardMetrics(revenue, ordersToday, newUsers, active, restaurantsActive, driversActive);
    }

    public List<Order> liveOrders() { return orders.findTop50ByCreatedAtAfterOrderByCreatedAtDesc(DateUtil.startOfToday()); }

    @Cacheable(value = CacheConstants.REVENUE_SUMMARIES, key = "#days")
    public RevenueAnalyticsResponse revenue(int days) {
        Instant from = DateUtil.startOfDaysAgo(days);
        List<Order> all = orders.findAll().stream()
            .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().isAfter(from)).toList();
        BigDecimal gross = all.stream().filter(o -> o.getPaymentStatus() == PaymentStatus.PAID)
            .map(Order::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal refunds = all.stream().filter(o -> o.getRefundAmount() != null).map(Order::getRefundAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal net = gross.subtract(refunds);

        Map<String, List<Order>> grouped = all.stream().collect(Collectors.groupingBy(o ->
            LocalDate.ofInstant(o.getCreatedAt(), ZoneOffset.UTC).toString()));
        List<RevenueAnalyticsResponse.DailyRevenue> series = grouped.entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .map(e -> {
                BigDecimal g = e.getValue().stream().filter(o -> o.getPaymentStatus() == PaymentStatus.PAID).map(Order::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal r = e.getValue().stream().filter(o -> o.getRefundAmount() != null).map(Order::getRefundAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
                return new RevenueAnalyticsResponse.DailyRevenue(e.getKey(), g, g.subtract(r), r);
            }).toList();

        Map<Long, BigDecimal> byRestaurant = all.stream().filter(o -> o.getPaymentStatus() == PaymentStatus.PAID)
            .collect(Collectors.groupingBy(Order::getRestaurantId,
                Collectors.reducing(BigDecimal.ZERO, Order::getTotalAmount, BigDecimal::add)));
        List<RevenueAnalyticsResponse.TopRestaurant> top = byRestaurant.entrySet().stream()
            .sorted(Map.Entry.<Long, BigDecimal>comparingByValue().reversed()).limit(10)
            .map(e -> new RevenueAnalyticsResponse.TopRestaurant(
                restaurants.findById(e.getKey()).map(Restaurant::getName).orElse("Unknown"), e.getValue())).toList();

        long count = all.stream().filter(o -> o.getPaymentStatus() == PaymentStatus.PAID).count();
        BigDecimal aov = count == 0 ? BigDecimal.ZERO : gross.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
        return new RevenueAnalyticsResponse(gross, net, refunds, series, top, aov);
    }

    @Cacheable(value = CacheConstants.ORDER_STATISTICS, key = "#days")
    public OrderAnalyticsResponse orderAnalytics(int days) {
        Instant from = DateUtil.startOfDaysAgo(days);
        List<Order> all = orders.findAll().stream().filter(o -> o.getCreatedAt() != null && o.getCreatedAt().isAfter(from)).toList();
        Map<String, Long> byStatus = all.stream().collect(Collectors.groupingBy(o -> o.getStatus().name(), Collectors.counting()));
        Map<String, List<Order>> grouped = all.stream().collect(Collectors.groupingBy(o ->
            LocalDate.ofInstant(o.getCreatedAt(), ZoneOffset.UTC).toString()));
        List<OrderAnalyticsResponse.DailyOrders> series = grouped.entrySet().stream().sorted(Map.Entry.comparingByKey())
            .map(e -> new OrderAnalyticsResponse.DailyOrders(e.getKey(), e.getValue().size(),
                e.getValue().stream().filter(o -> o.getStatus() == OrderStatus.CANCELLED).count())).toList();
        Map<Integer, Long> hourly = all.stream().collect(Collectors.groupingBy(o ->
            LocalDateTime.ofInstant(o.getCreatedAt(), ZoneOffset.UTC).getHour(), Collectors.counting()));
        List<OrderAnalyticsResponse.PeakHour> peaks = hourly.entrySet().stream()
            .map(e -> new OrderAnalyticsResponse.PeakHour(e.getKey(), e.getValue()))
            .sorted(Comparator.comparingInt(OrderAnalyticsResponse.PeakHour::hour)).toList();
        double avgDelivery = all.stream().filter(o -> o.getDeliveredAt() != null && o.getCreatedAt() != null)
            .mapToLong(o -> Duration.between(o.getCreatedAt(), o.getDeliveredAt()).toMinutes()).average().orElse(0);
        return new OrderAnalyticsResponse(all.size(), byStatus, series, peaks, avgDelivery);
    }

    @Cacheable(value = CacheConstants.ANALYTICS_METRICS, key = "#days")
    public UserAnalyticsResponse userAnalytics(int days) {
        Instant from = DateUtil.startOfDaysAgo(days);
        long total = users.count();
        long newU = users.countByCreatedAtAfter(from);
        return new UserAnalyticsResponse(total, newU, newU, List.of(), 0.0);
    }

    @Cacheable(value = CacheConstants.ANALYTICS_METRICS)
    public List<HeatmapCell> heatmap() {
        List<Order> all = orders.findAll();
        Map<String, Long> grid = all.stream().filter(o -> o.getCreatedAt() != null).collect(Collectors.groupingBy(o -> {
            LocalDateTime t = LocalDateTime.ofInstant(o.getCreatedAt(), ZoneOffset.UTC);
            return t.getDayOfWeek().getValue() % 7 + ":" + t.getHour();
        }, Collectors.counting()));
        List<HeatmapCell> cells = new ArrayList<>();
        for (int d = 0; d < 7; d++) for (int h = 0; h < 24; h++)
            cells.add(new HeatmapCell(d, h, grid.getOrDefault(d + ":" + h, 0L)));
        return cells;
    }

    @Cacheable(value = CacheConstants.REVENUE_SUMMARIES, key = "{#restaurantId, #days, #commissionRate}")
    public VendorEarningsResponse vendorEarnings(Long restaurantId, int days, BigDecimal commissionRate) {
        Instant from = DateUtil.startOfDaysAgo(days);
        List<Order> all = orders.findAll().stream()
            .filter(o -> o.getRestaurantId().equals(restaurantId) && o.getPaymentStatus() == PaymentStatus.PAID
                && o.getCreatedAt() != null && o.getCreatedAt().isAfter(from)).toList();
        BigDecimal gross = all.stream().map(Order::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal commission = gross.multiply(commissionRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal net = gross.subtract(commission);
        Map<String, List<Order>> grouped = all.stream().collect(Collectors.groupingBy(o ->
            LocalDate.ofInstant(o.getCreatedAt(), ZoneOffset.UTC).toString()));
        List<VendorEarningsResponse.DaySeries> series = grouped.entrySet().stream().sorted(Map.Entry.comparingByKey())
            .map(e -> {
                BigDecimal g = e.getValue().stream().map(Order::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal c = g.multiply(commissionRate).setScale(2, RoundingMode.HALF_UP);
                return new VendorEarningsResponse.DaySeries(e.getKey(), g, g.subtract(c), e.getValue().size());
            }).toList();
        Map<String, long[]> dishStats = new HashMap<>();
        for (Order o : all) {
            for (OrderItem oi : orderItems.findByOrderId(o.getId())) {
                dishStats.computeIfAbsent(oi.getName(), k -> new long[]{0, 0});
                dishStats.get(oi.getName())[0] += oi.getQuantity();
                dishStats.get(oi.getName())[1] += oi.getTotalPrice().longValue();
            }
        }
        List<VendorEarningsResponse.TopDish> topDishes = dishStats.entrySet().stream()
            .sorted((a, b) -> Long.compare(b.getValue()[0], a.getValue()[0])).limit(10)
            .map(e -> new VendorEarningsResponse.TopDish(e.getKey(), e.getValue()[0], BigDecimal.valueOf(e.getValue()[1]))).toList();
        return new VendorEarningsResponse(gross, commissionRate, commission, net, all.size(), series, topDishes);
    }
}
