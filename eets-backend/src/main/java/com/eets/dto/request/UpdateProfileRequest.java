package com.eets.dto.request;

import jakarta.validation.constraints.*;
public record UpdateProfileRequest(@Size(max=120) String name, @Email String email, String profileImageUrl, String phone) {}
