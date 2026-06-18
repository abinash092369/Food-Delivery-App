package com.eets.dto.response;

import java.time.Instant;
public record OrderStatusHistoryResponse(String status, Instant changedAt, String notes) {}
