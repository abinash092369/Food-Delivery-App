package com.eets.dto.request;

import jakarta.validation.constraints.NotBlank;
public record DriverStatusRequest(@NotBlank String status) {}
