package com.eets.dto.response;

import java.math.BigDecimal;
public record ValidateCouponResponse(boolean valid, BigDecimal discountAmount, String message) {}
