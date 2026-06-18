package com.eets.controller;

import com.eets.dto.request.PromotionRequest;
import com.eets.dto.response.PromotionResponse;
import com.eets.security.CurrentUser;
import com.eets.service.VendorService;
import com.eets.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vendor/promotions")
@RequiredArgsConstructor
public class VendorPromotionController {
    private final VendorService vendor;
    @GetMapping public ApiResponse<List<PromotionResponse>> list() { return ApiResponse.ok(vendor.listPromotions(CurrentUser.id())); }
    @PostMapping public ApiResponse<PromotionResponse> add(@Valid @RequestBody PromotionRequest req) { return ApiResponse.ok(vendor.addPromotion(CurrentUser.id(), req)); }
    @DeleteMapping("/{id}") public ApiResponse<Map<String, String>> del(@PathVariable Long id) {
        vendor.deletePromotion(CurrentUser.id(), id); return ApiResponse.ok(Map.of("status", "deleted"));
    }
}
