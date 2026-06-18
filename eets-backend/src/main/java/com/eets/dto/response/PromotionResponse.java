package com.eets.dto.response;

import com.eets.domain.ApplicableTo;
import java.math.BigDecimal;
import java.time.Instant;
public record PromotionResponse(Long id, String type, BigDecimal value, BigDecimal minOrder,
    ApplicableTo applicableTo, Long applicableId, String bannerUrl, Integer usageLimit,
    Integer currentUsage, Instant validFrom, Instant validUntil, Boolean isActive) {}
