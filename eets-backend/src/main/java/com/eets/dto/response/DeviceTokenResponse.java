package com.eets.dto.response;

import java.time.Instant;

public record DeviceTokenResponse(
    Long id,
    String token,
    String platform,
    String deviceName,
    Boolean isActive,
    Instant lastUsedAt,
    Instant createdAt
) {}
