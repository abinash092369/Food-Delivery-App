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
@RequestMapping("/api/vendor/menu")
@RequiredArgsConstructor
public class VendorMenuController {
    private final VendorService vendor;
    private final MenuService menuService;

    @GetMapping
    public ApiResponse<MenuResponse> myMenu() {
        var r = vendor.myRestaurant(CurrentUser.id());
        return ApiResponse.ok(menuService.fullMenu(r.getId()));
    }

    @PostMapping("/categories")
    public ApiResponse<MenuCategoryResponse> addCat(@Valid @RequestBody MenuCategoryRequest req) {
        return ApiResponse.ok(vendor.addCategory(CurrentUser.id(), req));
    }
    @PutMapping("/categories/{id}")
    public ApiResponse<MenuCategoryResponse> updateCat(@PathVariable Long id, @Valid @RequestBody MenuCategoryRequest req) {
        return ApiResponse.ok(vendor.updateCategory(CurrentUser.id(), id, req));
    }
    @DeleteMapping("/categories/{id}")
    public ApiResponse<Map<String, String>> delCat(@PathVariable Long id) {
        vendor.deleteCategory(CurrentUser.id(), id);
        return ApiResponse.ok(Map.of("status", "deleted"));
    }

    @PostMapping("/items")
    public ApiResponse<MenuItemResponse> addItem(@Valid @RequestBody MenuItemRequest req) {
        return ApiResponse.ok(vendor.addItem(CurrentUser.id(), req));
    }
    @PutMapping("/items/{id}")
    public ApiResponse<MenuItemResponse> updateItem(@PathVariable Long id, @Valid @RequestBody MenuItemRequest req) {
        return ApiResponse.ok(vendor.updateItem(CurrentUser.id(), id, req));
    }
    @DeleteMapping("/items/{id}")
    public ApiResponse<Map<String, String>> delItem(@PathVariable Long id) {
        vendor.deleteItem(CurrentUser.id(), id);
        return ApiResponse.ok(Map.of("status", "deleted"));
    }
    @PatchMapping("/items/{id}/availability")
    public ApiResponse<MenuItemResponse> avail(@PathVariable Long id, @Valid @RequestBody AvailabilityRequest req) {
        return ApiResponse.ok(vendor.setItemAvailability(CurrentUser.id(), id, req.isAvailable()));
    }
    @PatchMapping("/items/{id}/featured")
    public ApiResponse<MenuItemResponse> feat(@PathVariable Long id, @Valid @RequestBody FeaturedRequest req) {
        return ApiResponse.ok(vendor.setItemFeatured(CurrentUser.id(), id, req.isFeatured()));
    }
}
