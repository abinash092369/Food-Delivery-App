package com.eets.controller;

import com.eets.dto.request.*;
import com.eets.dto.response.*;
import com.eets.security.CurrentUser;
import com.eets.service.*;
import com.eets.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/vendor/restaurant")
@RequiredArgsConstructor
public class VendorRestaurantController {
    private final VendorService vendor;
    private final RestaurantService restaurantService;

    @GetMapping
    public ApiResponse<RestaurantDetailResponse> get() {
        RestaurantDetailResponse res = vendor.getMyRestaurant(CurrentUser.id(), restaurantService);
        System.out.println("[VENDOR_STATUS_GET] isOpen=" + res.isOpen());
        return ApiResponse.ok(res);
    }
    @PutMapping
    public ApiResponse<RestaurantDetailResponse> update(@Valid @RequestBody RestaurantUpdateRequest req) {
        return ApiResponse.ok(vendor.updateMyRestaurant(CurrentUser.id(), req, restaurantService));
    }
    @PatchMapping("/status")
    public ApiResponse<Map<String, Boolean>> setStatus(@Valid @RequestBody VendorRestaurantStatusRequest req) {
        System.out.println("[VENDOR_STATUS_SET_REQUEST] isOpen=" + req.isOpen());
        Map<String, Boolean> res = vendor.setStatus(CurrentUser.id(), req.isOpen());
        System.out.println("[VENDOR_STATUS_SET_RESULT] isOpen=" + res.get("isOpen"));
        return ApiResponse.ok(res);
    }
}
