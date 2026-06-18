package com.eets.dto.request;

import com.eets.domain.ApplicableTo;
import java.math.BigDecimal;
import java.time.Instant;
public record PromotionRequest(String type, BigDecimal value, BigDecimal minOrder,
    ApplicableTo applicableTo, Long applicableId, String bannerUrl,
    Integer usageLimit, Instant validFrom, Instant validUntil) {}
