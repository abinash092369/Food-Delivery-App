package com.eets.dto.response;

import java.math.BigDecimal;
public record InitiateOrderResponse(Long orderId, String orderNumber,
    String razorpayOrderId, BigDecimal amount, String currency, String keyId,
    Prefill prefill) {
    public record Prefill(String name, String email, String phone) {}
}
