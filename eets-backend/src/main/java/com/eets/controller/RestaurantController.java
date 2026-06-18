package com.eets.controller;

import com.eets.dto.response.*;
import com.eets.service.RestaurantService;
import com.eets.service.MenuService;
import com.eets.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/restaurants")
@RequiredArgsConstructor
public class RestaurantController {
    private final RestaurantService restaurantService;
    private final MenuService menuService;

    @GetMapping
    public ApiResponse<RestaurantService.PageResponse<RestaurantCardResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {
        return ApiResponse.ok(restaurantService.list(page, size, city, q, sort, lat, lng));
    }
    @GetMapping("/{slug}")
    public ApiResponse<RestaurantDetailResponse> detail(@PathVariable String slug) {
        return ApiResponse.ok(restaurantService.getBySlug(slug));
    }
    @GetMapping("/{slug}/menu")
    public ApiResponse<MenuResponse> menu(@PathVariable String slug) {
        var r = restaurantService.getBySlug(slug);
        return ApiResponse.ok(menuService.fullMenu(r.id()));
    }
}
