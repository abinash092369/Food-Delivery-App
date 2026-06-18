package com.eets.dto.response;

import com.eets.domain.Role;
import java.time.Instant;
public record AdminUserResponse(Long id, String name, String email, String phone, Role role,
    Boolean isActive, Boolean isBanned, String banReason, Instant lastLoginAt, Instant createdAt) {}
