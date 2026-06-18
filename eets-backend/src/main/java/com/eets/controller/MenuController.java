package com.eets.controller;

import com.eets.dto.response.MenuItemResponse;
import com.eets.dto.response.MenuResponse;
import com.eets.service.MenuService;
import com.eets.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {
    private final MenuService menuService;

    @GetMapping("/items/{id}")
    public ApiResponse<MenuItemResponse> get(@PathVariable Long id) {
        return ApiResponse.ok(menuService.getItem(id));
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ApiResponse<MenuResponse> getByRestaurant(@PathVariable Long restaurantId) {
        return ApiResponse.ok(menuService.fullMenu(restaurantId));
    }
}
