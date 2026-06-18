package com.eets.dto.request;

import jakarta.validation.constraints.NotBlank;
public record DeliveryStatusRequest(@NotBlank String status, String otp) {}
