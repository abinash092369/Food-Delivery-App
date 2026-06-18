package com.eets.dto.request;

import jakarta.validation.constraints.*;
public record VerifyPaymentRequest(
    @NotBlank String razorpayOrderId,
    @NotBlank String razorpayPaymentId,
    @NotBlank String razorpaySignature,
    @NotNull Long orderId) {}
