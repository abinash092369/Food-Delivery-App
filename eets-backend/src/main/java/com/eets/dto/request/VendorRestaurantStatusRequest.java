package com.eets.dto.request;

import jakarta.validation.constraints.NotNull;

public record VendorRestaurantStatusRequest(@NotNull Boolean isOpen) {}
