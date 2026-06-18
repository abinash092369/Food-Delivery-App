package com.eets.controller;

import com.eets.dto.request.*;
import com.eets.dto.response.*;
import com.eets.security.CurrentUser;
import com.eets.service.*;
import com.eets.util.ApiResponse;
import com.eets.util.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/driver")
@RequiredArgsConstructor
public class DriverController {
    private final DriverService drivers;
    private final DeliveryService delivery;

    @GetMapping("/profile")
    public ApiResponse<DriverProfileResponse> profile() { return ApiResponse.ok(drivers.getProfile(CurrentUser.id())); }
    @PutMapping("/profile")
    public ApiResponse<DriverProfileResponse> update(@Valid @RequestBody DriverProfileUpdateRequest req) {
        return ApiResponse.ok(drivers.updateProfile(CurrentUser.id(), req));
    }
    @PatchMapping("/status")
    public ApiResponse<Map<String, Boolean>> status(@Valid @RequestBody DriverStatusRequest req) {
        return ApiResponse.ok(drivers.setOnline(CurrentUser.id(), "ONLINE".equalsIgnoreCase(req.status())));
    }
    @GetMapping({"/current-assignment", "/assignments/current"})
    public ApiResponse<DeliveryResponse> current() { 
        log.info("[DRIVER_API_CURRENT] Driver {} requested current assignment", CurrentUser.id());
        return ApiResponse.ok(drivers.currentAssignment(CurrentUser.id())); 
    }
    @GetMapping("/assignments/available")
    public ApiResponse<java.util.List<DeliveryResponse>> available() {
        log.info("[DRIVER_API_AVAILABLE] Driver {} requested available assignments", CurrentUser.id());
        return ApiResponse.ok(drivers.availableAssignments(CurrentUser.id()));
    }
    @GetMapping("/history")
    public ApiResponse<PageResponse<DeliveryResponse>> history(@RequestParam(defaultValue = "0") int page,
                                                                 @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(drivers.history(CurrentUser.id(), page, size));
    }
    @GetMapping("/earnings")
    public ApiResponse<DriverEarningsResponse> earnings() { return ApiResponse.ok(drivers.earnings(CurrentUser.id())); }

    @PostMapping("/assignments/{id}/accept")
    public ApiResponse<DeliveryResponse> accept(@PathVariable Long id) {
        return ApiResponse.ok(delivery.acceptAssignment(CurrentUser.id(), id));
    }
    @PostMapping("/assignments/{id}/reject")
    public ApiResponse<Map<String, String>> reject(@PathVariable Long id, @Valid @RequestBody(required = false) CancelOrderRequest req) {
        delivery.rejectAssignment(CurrentUser.id(), id, req == null ? "Unspecified" : req.reason());
        return ApiResponse.ok(Map.of("status", "rejected"));
    }
    @PatchMapping("/assignments/{id}/status")
    public ApiResponse<DeliveryResponse> updateStatus(@PathVariable Long id, @Valid @RequestBody DeliveryStatusRequest req) {
        return ApiResponse.ok(delivery.updateStatus(CurrentUser.id(), id, req.status(), req.otp()));
    }
}
