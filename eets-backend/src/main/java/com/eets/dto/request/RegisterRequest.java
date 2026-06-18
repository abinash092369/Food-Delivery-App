package com.eets.dto.request;

import jakarta.validation.constraints.*;
public record RegisterRequest(
    @NotBlank @Size(max=120) String name,
    @NotBlank @Email String email,
    @NotBlank @Size(min=8, max=72) String password,
    @Pattern(regexp="^[6-9]\\d{9}$", message="Invalid Indian phone") String phone
) {}
