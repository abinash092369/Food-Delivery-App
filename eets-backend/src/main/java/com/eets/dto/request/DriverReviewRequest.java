package com.eets.dto.request;

import jakarta.validation.constraints.*;

/**
 * Request body for POST /api/driver-reviews.
 *
 * @param orderId  The delivered order being reviewed (must belong to caller).
 * @param rating   Star rating 1–5.
 * @param comment  Optional free-text feedback.
 */
public record DriverReviewRequest(
        @NotNull(message = "orderId is required")
        Long orderId,

        @Min(value = 1, message = "Rating must be at least 1")
        @Max(value = 5, message = "Rating must be at most 5")
        int rating,

        String comment
) {}
