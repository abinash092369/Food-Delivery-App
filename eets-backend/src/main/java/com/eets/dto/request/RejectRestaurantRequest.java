package com.eets.dto.request;

import jakarta.validation.constraints.NotBlank;
public record RejectRestaurantRequest(@NotBlank String reason) {}
