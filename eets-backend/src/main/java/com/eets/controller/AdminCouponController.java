package com.eets.controller;

import com.eets.dto.request.CouponCreateRequest;
import com.eets.dto.response.CouponResponse;
import com.eets.security.CurrentUser;
import com.eets.service.*;
import com.eets.util.ApiResponse;
import com.eets.util.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/coupons")
@RequiredArgsConstructor
public class AdminCouponController {
    private final AdminService admin;
    private final CouponService couponService;
    @GetMapping
    public ApiResponse<PageResponse<CouponResponse>> list(@RequestParam(defaultValue = "0") int page,
                                                           @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(admin.listCoupons(page, size, couponService));
    }
    @PostMapping
    public ApiResponse<CouponResponse> create(@Valid @RequestBody CouponCreateRequest req) {
        return ApiResponse.ok(admin.createCoupon(CurrentUser.id(), req, couponService));
    }
    @DeleteMapping("/{id}")
    public ApiResponse<Map<String, String>> delete(@PathVariable Long id) {
        admin.deleteCoupon(id); return ApiResponse.ok(Map.of("status", "deleted"));
    }
}
