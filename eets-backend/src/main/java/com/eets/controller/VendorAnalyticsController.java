package com.eets.controller;

import com.eets.dto.response.*;
import com.eets.security.CurrentUser;
import com.eets.service.*;
import com.eets.util.ApiResponse;
import com.eets.util.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/vendor")
@RequiredArgsConstructor
public class VendorAnalyticsController {
    private final VendorService vendor;
    private final AnalyticsService analytics;
    private final ReviewService reviewService;

    @Value("${eets.commission.vendor-rate}")
    private BigDecimal vendorRate;

    @GetMapping("/analytics/earnings")
    public ApiResponse<VendorEarningsResponse> earnings(@RequestParam(defaultValue = "30") int days) {
        var r = vendor.myRestaurant(CurrentUser.id());
        return ApiResponse.ok(analytics.vendorEarnings(r.getId(), days, vendorRate));
    }
    @GetMapping("/reviews")
    public ApiResponse<PageResponse<ReviewResponse>> reviews(@RequestParam(defaultValue = "0") int page,
                                                              @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(vendor.myReviews(CurrentUser.id(), page, size));
    }
}
