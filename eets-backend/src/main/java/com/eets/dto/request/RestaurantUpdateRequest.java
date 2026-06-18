package com.eets.dto.request;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
public record RestaurantUpdateRequest(
    String name, String description, List<String> cuisineTypes,
    String coverImageUrl, String logoUrl, String addressLine,
    String city, String state, String pincode, Double lat, Double lng,
    BigDecimal minOrderAmount, Integer deliveryTimeMin, BigDecimal deliveryFee,
    LocalTime openingTime, LocalTime closingTime, List<Integer> daysOpen,
    Boolean isOpen) {}
