package com.eets.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
public record ValidateCouponRequest(
    @NotBlank String code,
    @NotNull BigDecimal cartTotal,
    @NotNull Long restaurantId) {}
