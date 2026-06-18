package com.eets.controller;

import com.eets.dto.request.*;
import com.eets.dto.response.*;
import com.eets.security.CurrentUser;
import com.eets.service.OrderService;
import com.eets.util.ApiResponse;
import com.eets.util.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orders;

    @PostMapping("/initiate")
    public ApiResponse<InitiateOrderResponse> initiate(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody InitiateOrderRequest req) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return ApiResponse.ok(orders.initiate(CurrentUser.id(), req));
        }
        return ApiResponse.ok(orders.initiateIdempotent(CurrentUser.id(), req, idempotencyKey));
    }
    @PostMapping("/verify-payment")
    public ApiResponse<Map<String, Object>> verify(@Valid @RequestBody VerifyPaymentRequest req) {
        return ApiResponse.ok(orders.verifyPayment(CurrentUser.id(), req));
    }
    @GetMapping
    public ApiResponse<PageResponse<OrderResponse>> list(@RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(orders.userOrders(CurrentUser.id(), page, size));
    }
    @GetMapping("/{id}")
    public ApiResponse<OrderResponse> get(@PathVariable Long id) {
        return ApiResponse.ok(orders.getOrder(CurrentUser.id(), id));
    }
    @PatchMapping("/{id}/cancel")
    public ApiResponse<Map<String, String>> cancel(@PathVariable Long id, @Valid @RequestBody CancelOrderRequest req) {
        orders.cancelOrder(CurrentUser.id(), id, req.reason());
        return ApiResponse.ok(Map.of("status", "cancelled"));
    }
    @PostMapping("/{id}/reorder")
    public ApiResponse<Map<String, Object>> reorder(@PathVariable Long id) {
        return ApiResponse.ok(orders.reorder(CurrentUser.id(), id));
    }
    @GetMapping("/{id}/tracking")
    public ApiResponse<OrderResponse> tracking(@PathVariable Long id) {
        return ApiResponse.ok(orders.getOrder(CurrentUser.id(), id));
    }
}
