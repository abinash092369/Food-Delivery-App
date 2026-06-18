package com.eets.dto.request;

import jakarta.validation.constraints.*;
public record AvailabilityRequest(@NotNull Boolean isAvailable) {}
