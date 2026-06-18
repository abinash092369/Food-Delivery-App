package com.eets.dto.response;

import com.eets.domain.CouponType;
import java.math.BigDecimal;
import java.time.Instant;
public record CouponResponse(Long id, String code, CouponType type, BigDecimal value,
    BigDecimal maxDiscount, BigDecimal minOrderAmount,
    Instant validFrom, Instant validUntil, Boolean isActive, Long applicableRestaurantId) {}
