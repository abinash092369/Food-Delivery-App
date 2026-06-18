package com.eets.dto.request;

import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
public record MenuItemRequest(
    @NotBlank String name,
    String description,
    @NotNull @DecimalMin("0.01") BigDecimal price,
    @NotNull Long categoryId,
    @NotNull Boolean isVeg,
    String imageUrl,
    Boolean isAvailable,
    Boolean isFeatured,
    List<@Valid CustomizationGroup> customizationGroups) {
    public record CustomizationGroup(
        @NotBlank String name,
        @NotNull com.eets.domain.CustomizationType type,
        Boolean isRequired,
        @NotEmpty List<@Valid Option> options) {}
    public record Option(
        @NotBlank String name,
        @NotNull @DecimalMin("0.00") BigDecimal extraPrice) {}
}
