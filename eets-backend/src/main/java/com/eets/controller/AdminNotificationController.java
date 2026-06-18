package com.eets.controller;

import com.eets.dto.request.BroadcastNotificationRequest;
import com.eets.service.NotificationService;
import com.eets.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Admin-only notification operations.
 * POST /api/admin/notifications/broadcast
 */
@Tag(name = "Admin - Notifications", description = "Admin broadcast and notification management")
@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminNotificationController {

    private final NotificationService notifications;

    @Operation(
        summary = "Broadcast push notification",
        description = "Sends a push notification to all users, specific roles, or specific user IDs. " +
                      "For role/all targeting, uses Firebase FCM. Notification is also persisted in-app."
    )
    @PostMapping("/broadcast")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ApiResponse<Map<String, String>> broadcast(
            @Valid @RequestBody BroadcastNotificationRequest request) {
        notifications.broadcast(request);
        return ApiResponse.ok(Map.of("status", "queued",
                "message", "Broadcast notification enqueued for delivery"));
    }
}
