package com.eets.dto.request;

import jakarta.validation.constraints.*;
public record ResetPasswordRequest(@NotBlank String token, @NotBlank @Size(min=8) String newPassword) {}
