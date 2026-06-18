package com.eets.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsEvent {
    private String eventId;
    private String eventType;
    private Long orderId;
    private Long userId;
    private BigDecimal amount;
    private Instant timestamp;
}
