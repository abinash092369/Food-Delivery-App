package com.eets.controller;

import com.eets.domain.Role;
import com.eets.dto.request.*;
import com.eets.dto.response.AdminUserResponse;
import com.eets.service.AdminService;
import com.eets.util.ApiResponse;
import com.eets.util.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {
    private final AdminService admin;
    @GetMapping
    public ApiResponse<PageResponse<AdminUserResponse>> list(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Role role, @RequestParam(required = false) String q) {
        return ApiResponse.ok(admin.listUsers(page, size, role, q));
    }
    @GetMapping("/{id}") public ApiResponse<AdminUserResponse> get(@PathVariable Long id) { return ApiResponse.ok(admin.getUser(id)); }
    @PutMapping("/{id}")
    public ApiResponse<AdminUserResponse> update(@PathVariable Long id, @Valid @RequestBody AdminUserUpdateRequest req) {
        return ApiResponse.ok(admin.updateUser(id, req));
    }
    @PatchMapping("/{id}/ban")
    public ApiResponse<Map<String, String>> ban(@PathVariable Long id, @Valid @RequestBody BanUserRequest req) {
        admin.banUser(id, req.reason()); return ApiResponse.ok(Map.of("status", "banned"));
    }
}
