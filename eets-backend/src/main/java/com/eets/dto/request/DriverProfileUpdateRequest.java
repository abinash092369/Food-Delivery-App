package com.eets.dto.request;

import jakarta.validation.constraints.*;
public record DriverProfileUpdateRequest(String name, @Email String email, String profileImageUrl,
    String bankAccountNumber, String bankIfsc, String upiId) {}
