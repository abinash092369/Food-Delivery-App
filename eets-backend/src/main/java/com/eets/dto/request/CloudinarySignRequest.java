package com.eets.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;

public record CloudinarySignRequest(
    @NotBlank String folder,
    String publicId,
    String uploadPreset,
    Map<String, String> extraParams
) {}
