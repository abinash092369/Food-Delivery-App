package com.eets.controller;

import com.eets.dto.request.*;
import com.eets.dto.response.RestaurantDetailResponse;
import com.eets.service.AdminService;
import com.eets.util.ApiResponse;
import com.eets.util.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/restaurants")
@RequiredArgsConstructor
public class AdminRestaurantController {
    private final AdminService admin;
    @GetMapping
    public ApiResponse<PageResponse<RestaurantDetailResponse>> list(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q) { return ApiResponse.ok(admin.listRestaurants(page, size, q)); }
    @GetMapping("/pending")
    public ApiResponse<List<RestaurantDetailResponse>> pending() { return ApiResponse.ok(admin.pendingRestaurants()); }
    @PatchMapping("/{id}/approve")
    public ApiResponse<Map<String, String>> approve(@PathVariable Long id) { admin.approveRestaurant(id); return ApiResponse.ok(Map.of("status", "approved")); }
    @PatchMapping("/{id}/reject")
    public ApiResponse<Map<String, String>> reject(@PathVariable Long id, @Valid @RequestBody RejectRestaurantRequest req) {
        admin.rejectRestaurant(id, req.reason()); return ApiResponse.ok(Map.of("status", "rejected"));
    }
    @PatchMapping("/{id}/status")
    public ApiResponse<Map<String, String>> status(@PathVariable Long id, @Valid @RequestBody RestaurantStatusRequest req) {
        admin.setRestaurantStatus(id, req.status()); return ApiResponse.ok(Map.of("status", "updated"));
    }
}
