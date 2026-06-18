package com.eets.dto.response;

import java.math.BigDecimal;
public record OrderItemResponse(Long id, Long menuItemId, String name, int quantity,
    BigDecimal unitPrice, BigDecimal totalPrice, String selectedOptions) {}
