package com.eets.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DeviceTokenRequest(
    @NotBlank(message = "token must not be blank")
    @Size(max = 4096, message = "token too long")
    String token,

    /** Optional: ANDROID | IOS | WEB */
    String platform,

    /** Optional: e.g. "Pixel 8 Pro" */
    String deviceName
) {}
