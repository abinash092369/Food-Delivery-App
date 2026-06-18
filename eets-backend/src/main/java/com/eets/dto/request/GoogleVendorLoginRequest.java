package com.eets.dto.request;

import jakarta.validation.constraints.NotBlank;

public record GoogleVendorLoginRequest(@NotBlank String credential) {}
