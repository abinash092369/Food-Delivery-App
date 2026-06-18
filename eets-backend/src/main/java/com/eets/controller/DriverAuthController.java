package com.eets.controller;

import com.eets.dto.request.*;
import com.eets.dto.response.AuthResponse;
import com.eets.service.AuthService;
import com.eets.service.DriverService;
import com.eets.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/driver/auth")
@RequiredArgsConstructor
public class DriverAuthController {
    private final DriverService drivers;
    private final AuthService auth;
    @PostMapping("/register")
    public ApiResponse<Map<String, Object>> register(@Valid @RequestBody DriverRegisterRequest req) {
        return ApiResponse.ok(drivers.register(req));
    }
    @PostMapping("/otp/send")
    public ApiResponse<Map<String, String>> sendOtp(@Valid @RequestBody SendOtpRequest req) {
        auth.sendOtp(req); return ApiResponse.ok(Map.of("status", "sent"));
    }
    @PostMapping("/otp/verify")
    public ApiResponse<AuthResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest req) {
        return ApiResponse.ok(auth.verifyDriverOtp(req));
    }
}
