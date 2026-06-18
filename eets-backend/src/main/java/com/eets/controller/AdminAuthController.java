package com.eets.controller;

import com.eets.dto.request.LoginRequest;
import com.eets.dto.response.AuthResponse;
import com.eets.exception.UnauthorizedException;
import com.eets.service.AuthService;
import com.eets.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/auth")
@RequiredArgsConstructor
public class AdminAuthController {
    private final AuthService auth;
    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        AuthResponse r = auth.login(req);
        if (!"ADMIN".equals(r.user().role().name()) && !"SUPER_ADMIN".equals(r.user().role().name()))
            throw new UnauthorizedException("Admin access only");
        return ApiResponse.ok(r);
    }
}
