package com.eets.controller;

import com.eets.dto.request.*;
import com.eets.dto.response.*;
import com.eets.security.JwtTokenProvider;
import com.eets.security.SecurityConstants;
import com.eets.service.AuthService;
import com.eets.util.ApiResponse;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final JwtTokenProvider jwt;

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest req, HttpServletResponse res) {
        AuthResponse r = authService.register(req);
        setRefresh(res, authService.generateRefreshToken(r.user().id()));
        return ApiResponse.ok("Registered", r);
    }
    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest req, HttpServletResponse res) {
        AuthResponse r = authService.login(req);
        setRefresh(res, authService.generateRefreshToken(r.user().id()));
        return ApiResponse.ok("Logged in", r);
    }
    @PostMapping("/otp/send")
    public ApiResponse<Map<String, String>> sendOtp(@Valid @RequestBody SendOtpRequest req) {
        authService.sendOtp(req); return ApiResponse.ok(Map.of("status", "sent"));
    }
    @PostMapping("/otp/verify")
    public ApiResponse<AuthResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest req, HttpServletResponse res) {
        AuthResponse r = authService.verifyOtp(req);
        setRefresh(res, authService.generateRefreshToken(r.user().id()));
        return ApiResponse.ok(r);
    }
    @PostMapping("/google")
    public ApiResponse<AuthResponse> google(@Valid @RequestBody GoogleLoginRequest req, HttpServletResponse res) {
        AuthResponse r = authService.googleLogin(req);
        setRefresh(res, authService.generateRefreshToken(r.user().id()));
        return ApiResponse.ok(r);
    }
    @PostMapping("/google/vendor")
    public ApiResponse<GoogleVendorAuthResponse> googleVendor(@Valid @RequestBody GoogleVendorLoginRequest req, HttpServletResponse res) {
        GoogleVendorAuthResponse r = authService.googleVendorLogin(req);
        setRefresh(res, r.refreshToken());
        return ApiResponse.ok(r);
    }
    @PostMapping("/refresh")
    public ApiResponse<Map<String, String>> refresh(@CookieValue(value = SecurityConstants.REFRESH_COOKIE, required = false) String refresh) {
        if (refresh == null || !jwt.validate(refresh)) return ApiResponse.error("INVALID_REFRESH", "Missing or invalid refresh");
        Long uid = jwt.extractUserId(refresh);
        try {
            return ApiResponse.ok(Map.of("accessToken", authService.refreshToken(uid, refresh)));
        } catch (Exception e) {
            return ApiResponse.error("INVALID_REFRESH", e.getMessage());
        }
    }
    @PostMapping("/logout")
    public ApiResponse<Map<String, String>> logout(HttpServletRequest req, HttpServletResponse res) {
        String h = req.getHeader("Authorization");
        if (h != null && h.startsWith("Bearer ")) {
            String token = h.substring(7);
            authService.logout(token);
            try {
                Long uid = jwt.extractUserId(token);
                authService.revokeRefreshToken(uid);
            } catch (Exception ignored) {}
        }
        clearRefresh(res);
        return ApiResponse.ok(Map.of("status", "logged_out"));
    }
    @PostMapping("/forgot-password")
    public ApiResponse<Map<String, String>> forgot(@Valid @RequestBody ForgotPasswordRequest req) {
        authService.forgotPassword(req); return ApiResponse.ok(Map.of("status", "If account exists, email sent"));
    }
    @PostMapping("/reset-password")
    public ApiResponse<Map<String, String>> reset(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req); return ApiResponse.ok(Map.of("status", "password_reset"));
    }

    private void setRefresh(HttpServletResponse res, String refresh) {
        Cookie c = new Cookie(SecurityConstants.REFRESH_COOKIE, refresh);
        c.setHttpOnly(true); c.setPath("/"); c.setMaxAge((int) (7 * 24 * 3600));
        res.addCookie(c);
    }
    private void clearRefresh(HttpServletResponse res) {
        Cookie c = new Cookie(SecurityConstants.REFRESH_COOKIE, "");
        c.setHttpOnly(true); c.setPath("/"); c.setMaxAge(0);
        res.addCookie(c);
    }
}
