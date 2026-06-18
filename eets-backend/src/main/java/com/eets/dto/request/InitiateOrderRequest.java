package com.eets.dto.request;

import com.eets.domain.PaymentMethod;
import jakarta.validation.constraints.*;
public record InitiateOrderRequest(
    @NotNull Long addressId,
    @NotNull PaymentMethod paymentMethod,
    String couponCode,
    String specialInstructions) {}
