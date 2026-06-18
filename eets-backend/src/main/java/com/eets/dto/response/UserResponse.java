package com.eets.dto.response;

import com.eets.domain.Role;
import java.time.Instant;
public record UserResponse(Long id, String name, String email, String phone, String profileImageUrl,
    Role role, Boolean isEmailVerified, Boolean isPhoneVerified, Boolean isActive, Instant createdAt) {}
