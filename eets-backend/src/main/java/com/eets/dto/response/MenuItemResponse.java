package com.eets.dto.response;

import java.math.BigDecimal;
import java.util.List;
public record MenuItemResponse(Long id, Long categoryId, String name, String description,
    BigDecimal price, String imageUrl, Boolean isVeg, Boolean isAvailable, Boolean isFeatured,
    Double avgRating, List<CustomizationGroupResponse> customizationGroups) {}
