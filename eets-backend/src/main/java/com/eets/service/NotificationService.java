package com.eets.service;

import com.eets.domain.Notification;
import com.eets.domain.Role;
import com.eets.domain.User;
import com.eets.dto.request.BroadcastNotificationRequest;
import com.eets.dto.response.NotificationResponse;
import com.eets.firebase.FirebaseMessagingService;
import com.eets.repository.NotificationRepository;
import com.eets.repository.UserRepository;
import com.eets.util.PageResponse;
import com.eets.websocket.OrderSocketService;
import com.eets.dto.event.NotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Central notification service.
 * Persists in-app notifications, broadcasts via WebSocket,
 * and delivers push notifications to ALL registered device tokens via Firebase.
 *
 * Existing callers (OrderService, DeliveryService) are unchanged — they call
 * {@link #send(Long, String, String, String, Long)} exactly as before.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    // ---- Notification type constants ----------------------------------------
    public static final String ORDER_CREATED          = "ORDER_CREATED";
    public static final String ORDER_ACCEPTED         = "ORDER_ACCEPTED";
    public static final String ORDER_PREPARING        = "ORDER_PREPARING";
    public static final String ORDER_OUT_FOR_DELIVERY = "ORDER_OUT_FOR_DELIVERY";
    public static final String ORDER_DELIVERED        = "ORDER_DELIVERED";
    public static final String DRIVER_ASSIGNED        = "DRIVER_ASSIGNED";
    public static final String DRIVER_ARRIVED         = "DRIVER_ARRIVED";

    private final NotificationRepository    notifications;
    private final UserRepository            users;
    private final DeviceTokenService        deviceTokenService;
    private final FirebaseMessagingService  fcm;
    private final OrderSocketService        socket;
    private final KafkaEventProducer        kafkaEventProducer;

    @org.springframework.beans.factory.annotation.Value("${eets.kafka.enabled:false}")
    private boolean kafkaEnabled;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private NotificationService self;

    // =========================================================================
    // Core send — called by OrderService, DeliveryService (unchanged contract)
    // =========================================================================

    /**
     * Publishes a NotificationEvent to Kafka topic so that notifications
     * are processed and sent asynchronously.
     */
    public void send(Long userId, String title, String body, String type, Long referenceId) {
        try {
            NotificationEvent event = NotificationEvent.builder()
                    .eventId(UUID.randomUUID().toString())
                    .userId(userId)
                    .title(title)
                    .body(body)
                    .type(type)
                    .referenceId(referenceId)
                    .timestamp(Instant.now())
                    .build();
            if (kafkaEnabled) {
                kafkaEventProducer.sendNotificationEvent(event);
            } else {
                log.info("Kafka is disabled. Executing sendInternal directly for notification event to userId={} type={}", userId, type);
                self.sendInternal(event);
            }
        } catch (Exception e) {
            log.error("Failed to process notification event for userId={} and type={}: {}", userId, type, e.getMessage(), e);
        }
    }

    /**
     * Persists an in-app notification, pushes via WebSocket, and sends FCM to
     * all active device tokens of the target user. Called by the Kafka Consumer.
     */
    @Transactional
    public void sendInternal(NotificationEvent event) {
        if ("TRIGGER_DLQ".equals(event.getTitle())) {
            throw new RuntimeException("Forced exception for DLQ test");
        }
        try {
            Long userId = event.getUserId();
            String title = event.getTitle();
            String body = event.getBody();
            String type = event.getType();
            Long referenceId = event.getReferenceId();

            // 1. Persist in-app notification
            Notification n = Notification.builder()
                    .userId(userId)
                    .title(title)
                    .body(body)
                    .type(type)
                    .referenceId(referenceId)
                    .isRead(false)
                    .sentVia("[\"push\",\"in_app\"]")
                    .build();
            notifications.save(n);

            // 2. WebSocket real-time
            socket.notifyUser(userId, Map.of(
                    "title",       title,
                    "body",        body,
                    "type",        type,
                    "referenceId", referenceId == null ? "" : referenceId
            ));

            // 3. Firebase FCM — async, multi-device
            sendFcmToUser(userId, title, body, buildData(type, referenceId));
        } catch (Exception e) {
            log.error("Failed to send internal notification for eventId={}: {}", event.getEventId(), e.getMessage(), e);
        }
    }

    // =========================================================================
    // FCM delivery
    // =========================================================================

    /**
     * Sends FCM to all active device tokens of a user.
     * Also maintains the legacy single-token path from User.fcmToken for
     * backward compatibility with clients that haven't registered via
     * the new device-token endpoint yet.
     */
    @Async
    public void sendFcmToUser(Long userId, String title, String body, Map<String, String> data) {
        // Multi-device tokens (new path)
        List<String> tokens = new java.util.ArrayList<>(deviceTokenService.getActiveTokens(userId));

        // Legacy single-token fallback (User.fcmToken)
        users.findById(userId).map(User::getFcmToken)
                .filter(t -> t != null && !t.isBlank())
                .ifPresent(legacy -> {
                    if (!tokens.contains(legacy)) tokens.add(legacy);
                });

        if (tokens.isEmpty()) {
            log.debug("No FCM tokens for userId={}", userId);
            return;
        }

        // Send and clean up expired tokens
        List<String> failedTokens = fcm.sendToTokensSync(tokens, title, body, data);
        if (!failedTokens.isEmpty()) {
            deviceTokenService.removeInvalidTokens(failedTokens);
        }
    }

    /**
     * Legacy single-token send — kept for backward compatibility.
     * Prefer {@link #sendFcmToUser(Long, String, String, Map)} for new code.
     */
    @Async
    public void sendFcm(String token, String title, String body) {
        fcm.sendToToken(token, title, body, Map.of());
    }

    // =========================================================================
    // Broadcast (admin)
    // =========================================================================

    /**
     * Sends a broadcast push notification.
     * Targets: specific users, users by role, or all users (via FCM topic).
     */
    @Async
    @Transactional
    public void broadcast(BroadcastNotificationRequest req) {
        String title = req.title();
        String body  = req.body();
        String type  = req.type() != null ? req.type() : "BROADCAST";

        if (req.targetUserIds() != null && !req.targetUserIds().isEmpty()) {
            // Target specific users
            for (Long uid : req.targetUserIds()) {
                send(uid, title, body, type, null);
            }
            return;
        }

        if (req.targetRoles() != null && !req.targetRoles().isEmpty()) {
            // Target by role
            List<Role> roles = req.targetRoles().stream()
                    .map(r -> {
                        try { return Role.valueOf(r.toUpperCase()); }
                        catch (IllegalArgumentException e) { return null; }
                    })
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            List<Long> userIds = users.findAll().stream()
                    .filter(u -> roles.contains(u.getRole()) && Boolean.TRUE.equals(u.getIsActive()))
                    .map(User::getId)
                    .collect(Collectors.toList());

            // Persist in-app for each user
            List<Notification> bulk = userIds.stream().map(uid ->
                Notification.builder()
                    .userId(uid).title(title).body(body).type(type)
                    .isRead(false).sentVia("[\"push\",\"in_app\"]").build()
            ).collect(Collectors.toList());
            notifications.saveAll(bulk);

            // Push via FCM multi-device
            List<String> tokens = deviceTokenService.getActiveTokensForUsers(userIds);
            List<String> failed = fcm.sendToTokensSync(tokens, title, body, buildData(type, null));
            if (!failed.isEmpty()) deviceTokenService.removeInvalidTokens(failed);
            return;
        }

        // Default: FCM topic broadcast to "all"
        String topic = (req.topic() != null && !req.topic().isBlank()) ? req.topic() : "all";
        fcm.sendToTopic(topic, title, body, buildData(type, null));

        // Also persist for all active users (paginated to avoid OOM)
        persistBroadcastForAllUsers(title, body, type);
    }

    // =========================================================================
    // In-app notification queries
    // =========================================================================

    public PageResponse<NotificationResponse> list(Long userId, int page, int size, boolean unreadOnly) {
        Pageable p = PageRequest.of(page, size);
        Page<Notification> result = unreadOnly
                ? notifications.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId, p)
                : notifications.findByUserIdOrderByCreatedAtDesc(userId, p);
        return PageResponse.of(result.map(this::toResponse));
    }

    public PageResponse<NotificationResponse> listUnread(Long userId, int page, int size) {
        return list(userId, page, size, true);
    }

    @Transactional
    public void markRead(Long userId, Long notificationId) {
        notifications.findById(notificationId).ifPresent(n -> {
            if (!n.getUserId().equals(userId)) return; // security: own only
            n.setIsRead(true);
            notifications.save(n);
        });
    }

    @Transactional
    public void markAllRead(Long userId) {
        // Process in batches to avoid loading everything
        Pageable batch = PageRequest.of(0, 500);
        notifications.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId, batch)
                .forEach(n -> {
                    n.setIsRead(true);
                    notifications.save(n);
                });
    }

    public long countUnread(Long userId) {
        return notifications.countByUserIdAndIsReadFalse(userId);
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getId(), n.getTitle(), n.getBody(), n.getType(),
                n.getReferenceId(), n.getIsRead(), n.getCreatedAt()
        );
    }

    private Map<String, String> buildData(String type, Long referenceId) {
        Map<String, String> data = new HashMap<>();
        if (type != null)        data.put("type", type);
        if (referenceId != null) data.put("referenceId", referenceId.toString());
        return data;
    }

    private void persistBroadcastForAllUsers(String title, String body, String type) {
        try {
            int page = 0;
            int batchSize = 500;
            Page<User> userPage;
            do {
                userPage = users.findAll(PageRequest.of(page++, batchSize));
                List<Notification> bulk = userPage.getContent().stream()
                        .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                        .map(u -> Notification.builder()
                                .userId(u.getId()).title(title).body(body).type(type)
                                .isRead(false).sentVia("[\"push\",\"in_app\"]").build())
                        .collect(Collectors.toList());
                notifications.saveAll(bulk);
            } while (!userPage.isLast());
        } catch (Exception e) {
            log.warn("Broadcast persist failed: {}", e.getMessage());
        }
    }
}
