package com.eets.dto.request;

import jakarta.validation.constraints.*;
public record AdminUserUpdateRequest(String name, @Email String email, Boolean isActive) {}
