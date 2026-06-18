package com.eets.dto.response;

public record AuthResponse(String accessToken, UserResponse user, Boolean isNewUser) {
    public AuthResponse(String accessToken, UserResponse user) { this(accessToken, user, null); }
}
