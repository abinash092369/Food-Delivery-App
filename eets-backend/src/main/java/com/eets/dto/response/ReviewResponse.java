package com.eets.dto.response;

import java.time.Instant;
import java.util.List;
public record ReviewResponse(Long id, Long userId, String userName, String userAvatar,
    int rating, String reviewText, List<String> images, Instant createdAt, String replyText) {}
