package com.eets.dto.request;

import jakarta.validation.constraints.NotBlank;
public record ReviewReplyRequest(@NotBlank String replyText) {}
