package com.eets.dto.request;

import jakarta.validation.constraints.NotBlank;
public record MenuCategoryRequest(@NotBlank String name, String description, String imageUrl, Integer sortOrder) {}
