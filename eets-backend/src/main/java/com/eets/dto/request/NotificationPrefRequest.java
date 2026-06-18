package com.eets.dto.request;

import jakarta.validation.constraints.*;
public record NotificationPrefRequest(
    @NotNull Boolean push,
    @NotNull Boolean email,
    @NotNull Boolean sms,
    @NotNull Boolean orderUpdates,
    @NotNull Boolean promotions
) {}
