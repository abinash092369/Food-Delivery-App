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
public class PaymentEvent {
    private String eventId;
    private Long orderId;
    private String paymentId;
    private BigDecimal amount;
    private String status; // SUCCESS or FAILED
    private Long userId;
    private String errorMessage;
    private Instant timestamp;
}
