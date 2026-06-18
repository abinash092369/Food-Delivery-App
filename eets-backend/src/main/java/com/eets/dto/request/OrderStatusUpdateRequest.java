package com.eets.dto.request;

import com.eets.domain.OrderStatus;
import jakarta.validation.constraints.NotNull;
public record OrderStatusUpdateRequest(@NotNull OrderStatus status) {}
