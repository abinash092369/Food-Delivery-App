package com.eets.controller;

import com.eets.domain.OrderStatus;
import com.eets.dto.request.*;
import com.eets.dto.response.OrderResponse;
import com.eets.service.*;
import com.eets.util.ApiResponse;
import com.eets.util.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {
    private final AdminService admin;
    private final OrderService orderService;
    @GetMapping
    public ApiResponse<PageResponse<OrderResponse>> list(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size, @RequestParam(required = false) OrderStatus status) {
        return ApiResponse.ok(admin.listOrders(page, size, status));
    }
    @GetMapping("/{id}")
    public ApiResponse<OrderResponse> get(@PathVariable Long id) { return ApiResponse.ok(orderService.getOrderAsAdmin(id)); }
    @PostMapping("/{id}/refund")
    public ApiResponse<Map<String, String>> refund(@PathVariable Long id, @Valid @RequestBody RefundRequest req) {
        String result = orderService.adminRefund(id, req.amount(), req.reason());
        if ("manual_refund_required".equals(result)) {
            return ApiResponse.ok(Map.of(
                "status", "manual_refund_required",
                "message", "Refund must be processed manually for COD order"
            ));
        }
        return ApiResponse.ok(Map.of("status", "refunded"));
    }
    @PatchMapping("/{id}/notes")
    public ApiResponse<OrderResponse> notes(@PathVariable Long id, @Valid @RequestBody AdminNotesRequest req) {
        return ApiResponse.ok(admin.setOrderNotes(id, req.adminNotes()));
    }
}
