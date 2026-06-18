package com.eets.dto.response;

public record MenuCategoryResponse(Long id, String name, String description, String imageUrl,
    Integer sortOrder, Boolean isAvailable) {}
