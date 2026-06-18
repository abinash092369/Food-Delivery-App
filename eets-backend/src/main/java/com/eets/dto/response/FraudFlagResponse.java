package com.eets.dto.response;

import com.eets.domain.FraudStatus;
import java.time.Instant;
public record FraudFlagResponse(Long id, Long userId, Long orderId, String flagType,
    Integer riskScore, String details, FraudStatus status, Instant flaggedAt) {}
