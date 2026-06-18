package com.eets.dto.request;

import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import java.util.List;
public record AddToCartRequest(
    @NotNull Long menuItemId,
    @Min(1) int quantity,
    List<@Valid SelectedOption> selectedOptions) {
    public record SelectedOption(
        @NotNull Long groupId,
        @NotNull Long optionId) {}
}
