package com.eets.dto.request;

import jakarta.validation.constraints.NotBlank;

public record DeviceTokenDeleteRequest(
    @NotBlank(message = "token must not be blank")
    String token
) {}
