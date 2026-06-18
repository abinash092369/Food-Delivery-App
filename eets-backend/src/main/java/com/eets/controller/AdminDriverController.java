package com.eets.controller;

import com.eets.dto.response.DriverProfileResponse;
import com.eets.service.*;
import com.eets.util.ApiResponse;
import com.eets.util.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/drivers")
@RequiredArgsConstructor
public class AdminDriverController {
    private final AdminService admin;
    private final DriverService driverService;
    @GetMapping
    public ApiResponse<PageResponse<DriverProfileResponse>> list(@RequestParam(defaultValue = "0") int page,
                                                                  @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(admin.listDrivers(page, size, driverService));
    }
    @PatchMapping("/{id}/verify")
    public ApiResponse<Map<String, String>> verify(@PathVariable Long id) {
        admin.verifyDriver(id); return ApiResponse.ok(Map.of("status", "verified"));
    }
    @PatchMapping("/{id}/reject")
    public ApiResponse<Map<String, String>> reject(@PathVariable Long id) {
        admin.rejectDriver(id); return ApiResponse.ok(Map.of("status", "rejected"));
    }
}
