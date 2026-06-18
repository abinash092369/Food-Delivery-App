package com.eets.dto.response;

import java.util.List;

public record UnifiedSearchResponse(
    List<RestaurantCardResponse> restaurants,
    List<MenuItemResponse> menuItems
) {}
