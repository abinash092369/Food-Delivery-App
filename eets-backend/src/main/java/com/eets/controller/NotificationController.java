package com.eets.controller;

import com.eets.dto.request.DeviceTokenDeleteRequest;
import com.eets.dto.request.DeviceTokenRequest;
import com.eets.dto.response.DeviceTokenResponse;
import com.eets.dto.response.NotificationResponse;
import com.eets.security.CurrentUser;
import com.eets.service.DeviceTokenService;
import com.eets.service.NotificationService;
import com.eets.util.ApiResponse;
import com.eets.util.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Notification endpoints.
 *
 * Existing endpoints preserved (GET /api/notifications, PUT read/{id}, PUT read-all).
 * New endpoints added: device-token registration, unread list, broadcast.
 */
@Tag(name = "Notifications", description = "In-app notification management and device token registration")
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notifications;
    private final DeviceTokenService  deviceTokens;

    // =========================================================================
    // Device Token Management
    // =========================================================================

    @Operation(summary = "Register FCM device token for push notifications")
    @PostMapping("/device-token")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DeviceTokenResponse> registerDeviceToken(
            @Valid @RequestBody DeviceTokenRequest request) {
        DeviceTokenResponse response = deviceTokens.registerToken(CurrentUser.id(), request);
        return ApiResponse.ok("Device token registered", response);
    }

    @Operation(summary = "Remove FCM device token (e.g. on logout)")
    @DeleteMapping("/device-token")
    public ApiResponse<Map<String, String>> removeDeviceToken(
            @Valid @RequestBody DeviceTokenDeleteRequest request) {
        deviceTokens.removeToken(CurrentUser.id(), request.token());
        return ApiResponse.ok(Map.of("status", "removed"));
    }

    // =========================================================================
    // Notification History
    // =========================================================================

    @Operation(summary = "List all notifications (paginated)")
    @GetMapping
    public ApiResponse<PageResponse<NotificationResponse>> list(
            @RequestParam(defaultValue = "0")     int page,
            @RequestParam(defaultValue = "20")    int size,
            @RequestParam(defaultValue = "false") boolean unreadOnly) {
        return ApiResponse.ok(notifications.list(CurrentUser.id(), page, size, unreadOnly));
    }

    @Operation(summary = "List only unread notifications (paginated)")
    @GetMapping("/unread")
    public ApiResponse<PageResponse<NotificationResponse>> listUnread(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(notifications.listUnread(CurrentUser.id(), page, size));
    }

    // =========================================================================
    // Mark as Read
    // =========================================================================

    @Operation(summary = "Mark a single notification as read")
    @PutMapping("/read/{id}")
    public ApiResponse<Map<String, String>> markRead(@PathVariable Long id) {
        notifications.markRead(CurrentUser.id(), id);
        return ApiResponse.ok(Map.of("status", "ok"));
    }

    @Operation(summary = "Mark all notifications as read")
    @PutMapping("/read-all")
    public ApiResponse<Map<String, String>> markAllRead() {
        notifications.markAllRead(CurrentUser.id());
        return ApiResponse.ok(Map.of("status", "ok"));
    }

    // =========================================================================
    // Legacy PATCH aliases (preserved from original controller)
    // =========================================================================

    @PatchMapping("/{id}/read")
    public ApiResponse<Map<String, String>> markReadPatch(@PathVariable Long id) {
        notifications.markRead(CurrentUser.id(), id);
        return ApiResponse.ok(Map.of("status", "ok"));
    }

    @PatchMapping("/read-all")
    public ApiResponse<Map<String, String>> markAllReadPatch() {
        notifications.markAllRead(CurrentUser.id());
        return ApiResponse.ok(Map.of("status", "ok"));
    }
}
