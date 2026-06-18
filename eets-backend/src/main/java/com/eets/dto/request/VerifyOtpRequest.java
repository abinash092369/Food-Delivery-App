package com.eets.dto.request;

import jakarta.validation.constraints.*;
public record VerifyOtpRequest(
    @NotBlank @Pattern(regexp="^[6-9]\\d{9}$") String phone,
    @NotBlank String countryCode,
    @NotBlank @Pattern(regexp="^\\d{6}$") String otp
) {}
