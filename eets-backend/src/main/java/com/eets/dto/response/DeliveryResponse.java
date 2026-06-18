package com.eets.dto.response;

import com.eets.domain.AssignmentStatus;
import java.math.BigDecimal;
import java.time.Instant;
public record DeliveryResponse(Long id, Long orderId, String orderNumber,
    AssignmentStatus status, Instant assignedAt, Instant acceptedAt, Instant pickedUpAt, Instant deliveredAt,
    String pickupOtp, String deliveryOtp, Double distanceKm, BigDecimal earnings,
    String routePolyline, Integer estimatedDurationMin, Double routeDistanceKm, Instant routeGeneratedAt) {}
