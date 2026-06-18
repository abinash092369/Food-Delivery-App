package com.eets.dto.request;

import jakarta.validation.constraints.NotBlank;
public record ApplyCouponRequest(@NotBlank String code) {}
