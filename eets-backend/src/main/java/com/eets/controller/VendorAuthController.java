package com.eets.controller;
 
import com.eets.dto.request.*;
import com.eets.dto.response.AuthResponse;
import com.eets.service.AuthService;
import com.eets.service.VendorService;
import com.eets.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
 
import java.util.Map;
 
@RestController
@RequestMapping("/api/vendor/auth")
@RequiredArgsConstructor
public class VendorAuthController {
    private final VendorService vendor;
    private final AuthService auth;
 
    @PostMapping("/register")
    public ApiResponse<Map<String, Object>> register(@Valid @RequestBody VendorRegisterRequest req) {
        return ApiResponse.ok(vendor.register(req));
    }
 
    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ApiResponse.ok(auth.vendorLogin(req));
    }
}