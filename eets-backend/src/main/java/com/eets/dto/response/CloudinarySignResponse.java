package com.eets.dto.response;

import java.util.Map;

public record CloudinarySignResponse(
    String signature,
    long timestamp,
    String apiKey,
    String cloudName,
    String folder,
    String publicId,
    String uploadPreset,
    Map<String, String> params
) {}
