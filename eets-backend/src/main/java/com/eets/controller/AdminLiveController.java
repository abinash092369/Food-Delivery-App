package com.eets.controller;

import com.eets.dto.response.OrderResponse;
import com.eets.service.AnalyticsService;
import com.eets.service.OrderService;
import com.eets.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/live")
@RequiredArgsConstructor
public class AdminLiveController {
    private final AnalyticsService analytics;
    private final OrderService orderService;
    @GetMapping("/orders")
    public ApiResponse<List<OrderResponse>> live() {
        return ApiResponse.ok(orderService.toDtoListFromOrders(analytics.liveOrders()));
    }
}
