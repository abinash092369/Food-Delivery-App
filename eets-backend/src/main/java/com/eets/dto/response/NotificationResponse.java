package com.eets.dto.response;

import java.time.Instant;
public record NotificationResponse(Long id, String title, String body, String type,
    Long referenceId, Boolean isRead, Instant createdAt) {}
