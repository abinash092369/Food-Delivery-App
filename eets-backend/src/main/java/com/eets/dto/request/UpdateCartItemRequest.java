package com.eets.dto.request;

import jakarta.validation.constraints.Min;
public record UpdateCartItemRequest(@Min(0) int quantity) {}
