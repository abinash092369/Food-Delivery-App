package com.eets.dto.response;

public record GoogleVendorAuthResponse(
    String token,
    String refreshToken,
    UserResponse user,
    RestaurantDetailResponse restaurant
) {}
