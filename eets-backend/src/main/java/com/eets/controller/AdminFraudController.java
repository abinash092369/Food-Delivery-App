package com.eets.controller;

import com.eets.domain.FraudStatus;
import com.eets.domain.FraudAuditLog;
import com.eets.domain.User;
import com.eets.repository.UserRepository;
import com.eets.dto.response.FraudFlagResponse;
import com.eets.security.CurrentUser;
import com.eets.service.AdminService;
import com.eets.service.FraudThresholdService;
import com.eets.util.ApiResponse;
import com.eets.util.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/fraud")
@RequiredArgsConstructor
public class AdminFraudController {

    private final AdminService admin;
    private final FraudThresholdService thresholdService;
    private final UserRepository userRepo;

    @GetMapping
    public ApiResponse<PageResponse<FraudFlagResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) FraudStatus status) {
        return ApiResponse.ok(admin.listFlags(page, size, status));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<Map<String, String>> setStatus(@PathVariable Long id, @RequestParam FraudStatus status) {
        admin.resolveFlag(id, status);
        return ApiResponse.ok(Map.of("status", "updated"));
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getStats() {
        return ApiResponse.ok(admin.getFraudStats());
    }

    @PostMapping("/users/{id}/block")
    public ApiResponse<Map<String, String>> blockUser(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("reason", "Violated platform policy");
        String adminEmail = getAdminEmail();
        admin.blockUser(id, reason, adminEmail);
        return ApiResponse.ok(Map.of("status", "user_blocked"));
    }

    @PostMapping("/drivers/{id}/block")
    public ApiResponse<Map<String, String>> blockDriver(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("reason", "Violated platform policy");
        String adminEmail = getAdminEmail();
        admin.blockDriver(id, reason, adminEmail);
        return ApiResponse.ok(Map.of("status", "driver_blocked"));
    }

    @GetMapping("/thresholds")
    public ApiResponse<Map<String, Object>> getThresholds() {
        return ApiResponse.ok(thresholdService.getAllThresholds());
    }

    @PostMapping("/thresholds")
    public ApiResponse<Map<String, String>> updateThresholds(@RequestBody Map<String, String> body) {
        body.forEach(thresholdService::setValue);
        return ApiResponse.ok(Map.of("status", "thresholds_updated"));
    }

    @GetMapping("/audit-logs")
    public ApiResponse<PageResponse<FraudAuditLog>> listAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) Long targetId,
            @RequestParam(required = false) java.time.Instant startDate,
            @RequestParam(required = false) java.time.Instant endDate) {
        return ApiResponse.ok(admin.listAuditLogs(page, size, action, targetType, targetId, startDate, endDate));
    }

    private String getAdminEmail() {
        Long adminUserId = CurrentUser.idOrNull();
        if (adminUserId != null) {
            return userRepo.findById(adminUserId).map(User::getEmail).orElse("ADMIN_" + adminUserId);
        }
        return "SYSTEM";
    }
}
