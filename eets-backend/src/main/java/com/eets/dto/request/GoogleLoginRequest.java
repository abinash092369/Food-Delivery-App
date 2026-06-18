package com.eets.dto.request;

import jakarta.validation.constraints.NotBlank;
public record GoogleLoginRequest(@NotBlank String idToken) {}
