package com.eets.dto.request;

import jakarta.validation.constraints.*;
public record FeaturedRequest(@NotNull Boolean isFeatured) {}
