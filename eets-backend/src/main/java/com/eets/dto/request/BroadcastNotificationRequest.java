package com.eets.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record BroadcastNotificationRequest(
    @NotBlank(message = "title must not be blank")
    @Size(max = 200)
    String title,

    @NotBlank(message = "body must not be blank")
    @Size(max = 1000)
    String body,

    /** Notification type for client routing, e.g. PROMO */
    String type,

    /**
     * Optional: target specific roles (CUSTOMER, VENDOR, DRIVER).
     * If null/empty, targets ALL users.
     */
    List<String> targetRoles,

    /** Optional: specific user IDs to target. */
    List<Long> targetUserIds,

    /** Optional: FCM topic to broadcast on. Default: "all" */
    String topic
) {}
