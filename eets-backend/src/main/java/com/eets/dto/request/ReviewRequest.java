package com.eets.dto.request;

import jakarta.validation.constraints.*;
import java.util.List;
public record ReviewRequest(@NotNull Long orderId, @Min(1) @Max(5) int rating, String reviewText, List<String> images) {}
