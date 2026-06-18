package com.eets.dto.response;

import java.math.BigDecimal;
public record CartItemResponse(Long id, Long menuItemId, String name, String imageUrl,
    int quantity, BigDecimal itemPrice, BigDecimal totalPrice, String selectedOptions) {}
