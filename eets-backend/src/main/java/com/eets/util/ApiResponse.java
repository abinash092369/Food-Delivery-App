package com.eets.util;

import java.time.Instant;

public record ApiResponse<T>(boolean success, String message, T data, Instant timestamp, ErrorBody error) {
    public static <T> ApiResponse<T> ok(T data) { return new ApiResponse<>(true, "OK", data, Instant.now(), null); }
    public static <T> ApiResponse<T> ok(String message, T data) { return new ApiResponse<>(true, message, data, Instant.now(), null); }
    public static <T> ApiResponse<T> error(String code, String message) {
        return new ApiResponse<>(false, message, null, Instant.now(), new ErrorBody(code, message));
    }
    public record ErrorBody(String code, String message) {}
}
