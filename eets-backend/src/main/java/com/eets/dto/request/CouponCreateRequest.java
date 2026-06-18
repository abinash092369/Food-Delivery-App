package com.eets.dto.request;

import com.eets.domain.CouponType;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
public record CouponCreateRequest(
    @NotBlank String code, @NotNull CouponType type,
    @NotNull @DecimalMin("0.01") BigDecimal value,
    BigDecimal maxDiscount, BigDecimal minOrderAmount,
    Integer usageLimitPerUser, Integer totalUsageLimit,
    Instant validFrom, Instant validUntil,
    Long applicableRestaurantId) {}
