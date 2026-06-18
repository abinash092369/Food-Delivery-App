package com.eets.dto.response;

import com.eets.domain.VehicleType;
public record DriverProfileResponse(Long id, Long userId, String name, String email, String phone,
    String profileImageUrl, VehicleType vehicleType, String vehicleMake, String vehicleModel,
    String vehicleRegNumber, String bankAccountNumber, String bankIfsc, String upiId,
    Boolean isVerified, Boolean isOnline, Double currentLat, Double currentLng,
    Integer totalDeliveries, Double avgRating) {}
