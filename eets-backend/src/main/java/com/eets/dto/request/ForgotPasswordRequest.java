package com.eets.dto.request;

import jakarta.validation.constraints.*;
public record ForgotPasswordRequest(@NotBlank @Email String email) {}
