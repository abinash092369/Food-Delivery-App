package com.eets.controller;

import com.eets.dto.request.*;
import com.eets.dto.response.OrderResponse;
import com.eets.security.CurrentUser;
import com.eets.service.*;
import com.eets.util.ApiResponse;
import com.eets.util.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vendor/orders")
@RequiredArgsConstructor
public class VendorOrderController {
    private final VendorService vendor;
    private final OrderService orders;

    @GetMapping
    public ApiResponse<PageResponse<OrderResponse>> list(@RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(vendor.myOrders(CurrentUser.id(), page, size));
    }
    @PatchMapping("/{id}/status")
    public ApiResponse<OrderResponse> updateStatus(@PathVariable Long id, @Valid @RequestBody OrderStatusUpdateRequest req) {
        return ApiResponse.ok(orders.vendorUpdateStatus(CurrentUser.id(), id, req.status()));
    }
    @PatchMapping("/{id}/reject")
    public ApiResponse<OrderResponse> reject(@PathVariable Long id, @Valid @RequestBody CancelOrderRequest req) {
        return ApiResponse.ok(orders.vendorReject(CurrentUser.id(), id, req.reason()));
    }
}
