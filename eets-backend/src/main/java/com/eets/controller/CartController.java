package com.eets.controller;

import com.eets.dto.request.*;
import com.eets.dto.response.CartResponse;
import com.eets.security.CurrentUser;
import com.eets.service.CartService;
import com.eets.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {
    private final CartService cart;

    @GetMapping
    public ApiResponse<CartResponse> get() { return ApiResponse.ok(cart.getCart(CurrentUser.id())); }
    @PostMapping("/items")
    public ApiResponse<CartResponse> add(@Valid @RequestBody AddToCartRequest req) {
        return ApiResponse.ok(cart.addItem(CurrentUser.id(), req));
    }
    @PutMapping("/items/{itemId}")
    public ApiResponse<CartResponse> update(@PathVariable Long itemId, @Valid @RequestBody UpdateCartItemRequest req) {
        return ApiResponse.ok(cart.updateItem(CurrentUser.id(), itemId, req));
    }
    @DeleteMapping
    public ApiResponse<Map<String, String>> clear() {
        cart.clearCart(CurrentUser.id());
        return ApiResponse.ok(Map.of("status", "cleared"));
    }
    @PostMapping("/coupon")
    public ApiResponse<CartResponse> applyCoupon(@Valid @RequestBody ApplyCouponRequest req) {
        return ApiResponse.ok(cart.applyCoupon(CurrentUser.id(), req));
    }
    @DeleteMapping("/coupon")
    public ApiResponse<CartResponse> removeCoupon() {
        return ApiResponse.ok(cart.removeCoupon(CurrentUser.id()));
    }
}
