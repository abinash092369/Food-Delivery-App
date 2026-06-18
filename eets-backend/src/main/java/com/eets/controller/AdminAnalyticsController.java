package com.eets.controller;

import com.eets.dto.response.*;
import com.eets.service.AnalyticsService;
import com.eets.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/analytics")
@RequiredArgsConstructor
public class AdminAnalyticsController {
    private final AnalyticsService analytics;

    @GetMapping("/dashboard") public ApiResponse<AdminDashboardMetrics> dashboard() { return ApiResponse.ok(analytics.adminMetrics()); }
    @GetMapping("/revenue")
    public ApiResponse<RevenueAnalyticsResponse> revenue(@RequestParam(defaultValue = "30") int days) {
        return ApiResponse.ok(analytics.revenue(days));
    }
    @GetMapping("/orders")
    public ApiResponse<OrderAnalyticsResponse> orders(@RequestParam(defaultValue = "30") int days) {
        return ApiResponse.ok(analytics.orderAnalytics(days));
    }
    @GetMapping("/users")
    public ApiResponse<UserAnalyticsResponse> users(@RequestParam(defaultValue = "30") int days) {
        return ApiResponse.ok(analytics.userAnalytics(days));
    }
    @GetMapping("/heatmap") public ApiResponse<List<HeatmapCell>> heatmap() { return ApiResponse.ok(analytics.heatmap()); }
}
