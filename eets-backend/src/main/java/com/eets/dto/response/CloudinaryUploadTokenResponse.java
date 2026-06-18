package com.eets.dto.response;

public record CloudinaryUploadTokenResponse(
    String cloudName,
    String apiKey,
    long timestamp,
    String signature,
    String folder,
    String uploadPreset
) {}
