package com.eets.dto.request;

import jakarta.validation.constraints.NotBlank;
public record BanUserRequest(@NotBlank String reason) {}
