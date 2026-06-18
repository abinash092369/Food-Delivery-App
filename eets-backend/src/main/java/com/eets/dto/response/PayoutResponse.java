package com.eets.dto.response;

import com.eets.domain.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
public record PayoutResponse(Long id, PayoutType type, LocalDate periodStart, LocalDate periodEnd,
    Integer totalOrders, BigDecimal grossAmount, BigDecimal commissionAmount, BigDecimal netAmount,
    PayoutStatus status, Instant paidAt, String transactionRef) {}
