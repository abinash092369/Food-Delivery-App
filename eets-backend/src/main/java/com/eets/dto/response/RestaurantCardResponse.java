package com.eets.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record RestaurantCardResponse(Long id, String name, String slug, String coverImageUrl,
    String logoUrl, String imageUrl, List<String> cuisineTypes, Double avgRating, Integer totalRatings,
    Integer deliveryTimeMin, BigDecimal deliveryFee, BigDecimal minOrderAmount,
    Boolean isOpen, Double distance, Boolean isApproved, Boolean isActive) {

    public RestaurantCardResponse(Long id, String name, String slug, String coverImageUrl,
        List<String> cuisineTypes, Double avgRating, Integer totalRatings,
        Integer deliveryTimeMin, BigDecimal deliveryFee, BigDecimal minOrderAmount,
        Boolean isOpen, Double distance) {
        this(id, name, slug, coverImageUrl, null, null, cuisineTypes, avgRating, totalRatings,
             deliveryTimeMin, deliveryFee, minOrderAmount, isOpen, distance, null, null);
    }
}
