package com.eets.dto.response;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
public record RestaurantDetailResponse(Long id, String name, String slug, String description,
    List<String> cuisineTypes, String coverImageUrl, String logoUrl,
    String addressLine, String city, String state, String pincode, Double lat, Double lng,
    Boolean isOpen, Double avgRating, Integer totalRatings,
    BigDecimal minOrderAmount, Integer deliveryTimeMin, BigDecimal deliveryFee,
    LocalTime openingTime, LocalTime closingTime, List<Integer> daysOpen,
    Boolean isActive, Boolean isApproved, Long ownerId, String rejectionReason) {}
