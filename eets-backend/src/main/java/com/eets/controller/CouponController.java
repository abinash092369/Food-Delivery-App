package com.eets.controller;

import com.eets.dto.request.ValidateCouponRequest;
import com.eets.dto.response.*;
import com.eets.security.CurrentUser;
import com.eets.service.CouponService;
import com.eets.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {
    private final CouponService coupons;

    @GetMapping
    public ApiResponse<List<CouponResponse>> list() { return ApiResponse.ok(coupons.listVisible(CurrentUser.id())); }

    @PostMapping("/validate")
    public ApiResponse<ValidateCouponResponse> validate(@Valid @RequestBody ValidateCouponRequest req) {
        return ApiResponse.ok(coupons.validate(CurrentUser.id(), req));
    }
}
