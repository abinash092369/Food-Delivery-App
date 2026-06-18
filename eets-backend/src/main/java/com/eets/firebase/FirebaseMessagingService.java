package com.eets.firebase;

import com.eets.config.FirebaseConfig.FirebaseAvailability;
import com.google.firebase.messaging.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Thin wrapper around Firebase Cloud Messaging.
 * All methods are no-ops when Firebase is disabled/unavailable.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FirebaseMessagingService {

    private final FirebaseAvailability firebaseAvailability;

    // -------------------------------------------------------------------------
    // Single-device send
    // -------------------------------------------------------------------------

    /**
     * Sends a push notification to a single device token asynchronously.
     */
    @Async
    public void sendToToken(String token, String title, String body, Map<String, String> data) {
        if (!isReady(token)) return;
        try {
            Message msg = buildMessage(token, title, body, data);
            String messageId = FirebaseMessaging.getInstance().send(msg);
            log.debug("FCM sent to token {}: messageId={}", maskToken(token), messageId);
        } catch (FirebaseMessagingException e) {
            handleFcmException(e, token);
        }
    }

    /**
     * Sends a push notification to a single device token synchronously.
     * Returns message-id or null on failure.
     */
    public String sendToTokenSync(String token, String title, String body, Map<String, String> data) {
        if (!isReady(token)) return null;
        try {
            Message msg = buildMessage(token, title, body, data);
            return FirebaseMessaging.getInstance().send(msg);
        } catch (FirebaseMessagingException e) {
            handleFcmException(e, token);
            return null;
        }
    }

    // -------------------------------------------------------------------------
    // Multi-device send
    // -------------------------------------------------------------------------

    /**
     * Sends the same notification to multiple tokens (up to 500 per FCM batch).
     * Returns list of tokens that failed (invalid/expired) so callers can clean them up.
     */
    @Async
    public void sendToTokens(List<String> tokens, String title, String body, Map<String, String> data) {
        if (!firebaseAvailability.isAvailable() || tokens == null || tokens.isEmpty()) return;

        List<String> validTokens = tokens.stream()
                .filter(t -> t != null && !t.isBlank())
                .distinct()
                .toList();
        if (validTokens.isEmpty()) return;

        // FCM multicast allows max 500 tokens per batch
        for (int i = 0; i < validTokens.size(); i += 500) {
            List<String> batch = validTokens.subList(i, Math.min(i + 500, validTokens.size()));
            sendBatch(batch, title, body, data);
        }
    }

    /**
     * Sends to multiple tokens and returns the list of failed (expired/invalid) tokens.
     */
    public List<String> sendToTokensSync(List<String> tokens, String title, String body, Map<String, String> data) {
        List<String> failedTokens = new ArrayList<>();
        if (!firebaseAvailability.isAvailable() || tokens == null || tokens.isEmpty()) return failedTokens;

        List<String> validTokens = tokens.stream()
                .filter(t -> t != null && !t.isBlank())
                .distinct()
                .toList();

        for (int i = 0; i < validTokens.size(); i += 500) {
            List<String> batch = validTokens.subList(i, Math.min(i + 500, validTokens.size()));
            failedTokens.addAll(sendBatchSync(batch, title, body, data));
        }
        return failedTokens;
    }

    // -------------------------------------------------------------------------
    // Topic send (broadcast)
    // -------------------------------------------------------------------------

    @Async
    public void sendToTopic(String topic, String title, String body, Map<String, String> data) {
        if (!firebaseAvailability.isAvailable()) {
            log.debug("Firebase unavailable — skipping topic broadcast to '{}'", topic);
            return;
        }
        try {
            Message msg = Message.builder()
                    .setTopic(topic)
                    .setNotification(Notification.builder().setTitle(title).setBody(body).build())
                    .putAllData(data != null ? data : Map.of())
                    .build();
            String id = FirebaseMessaging.getInstance().send(msg);
            log.info("FCM topic '{}' broadcast sent: messageId={}", topic, id);
        } catch (FirebaseMessagingException e) {
            log.warn("FCM topic send failed for '{}': {}", topic, e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private boolean isReady(String token) {
        if (!firebaseAvailability.isAvailable()) {
            log.debug("Firebase unavailable — skipping FCM send");
            return false;
        }
        if (token == null || token.isBlank()) {
            log.debug("FCM token is blank — skipping send");
            return false;
        }
        return true;
    }

    private Message buildMessage(String token, String title, String body, Map<String, String> data) {
        return Message.builder()
                .setToken(token)
                .setNotification(Notification.builder().setTitle(title).setBody(body).build())
                .putAllData(data != null ? data : Map.of())
                .setAndroidConfig(AndroidConfig.builder()
                        .setPriority(AndroidConfig.Priority.HIGH)
                        .build())
                .setApnsConfig(ApnsConfig.builder()
                        .setAps(Aps.builder().setSound("default").build())
                        .build())
                .build();
    }

    private void sendBatch(List<String> tokens, String title, String body, Map<String, String> data) {
        try {
            MulticastMessage msg = MulticastMessage.builder()
                    .addAllTokens(tokens)
                    .setNotification(Notification.builder().setTitle(title).setBody(body).build())
                    .putAllData(data != null ? data : Map.of())
                    .setAndroidConfig(AndroidConfig.builder().setPriority(AndroidConfig.Priority.HIGH).build())
                    .setApnsConfig(ApnsConfig.builder().setAps(Aps.builder().setSound("default").build()).build())
                    .build();
            BatchResponse response = FirebaseMessaging.getInstance().sendEachForMulticast(msg);
            log.debug("FCM multicast batch: success={}, failure={}",
                    response.getSuccessCount(), response.getFailureCount());
        } catch (FirebaseMessagingException e) {
            log.warn("FCM multicast batch failed: {}", e.getMessage());
        }
    }

    private List<String> sendBatchSync(List<String> tokens, String title, String body, Map<String, String> data) {
        List<String> failed = new ArrayList<>();
        try {
            MulticastMessage msg = MulticastMessage.builder()
                    .addAllTokens(tokens)
                    .setNotification(Notification.builder().setTitle(title).setBody(body).build())
                    .putAllData(data != null ? data : Map.of())
                    .setAndroidConfig(AndroidConfig.builder().setPriority(AndroidConfig.Priority.HIGH).build())
                    .setApnsConfig(ApnsConfig.builder().setAps(Aps.builder().setSound("default").build()).build())
                    .build();
            BatchResponse response = FirebaseMessaging.getInstance().sendEachForMulticast(msg);
            List<SendResponse> responses = response.getResponses();
            for (int i = 0; i < responses.size(); i++) {
                if (!responses.get(i).isSuccessful()) {
                    failed.add(tokens.get(i));
                }
            }
        } catch (FirebaseMessagingException e) {
            log.warn("FCM batch sync failed: {}", e.getMessage());
        }
        return failed;
    }

    private void handleFcmException(FirebaseMessagingException e, String token) {
        MessagingErrorCode code = e.getMessagingErrorCode();
        if (code == MessagingErrorCode.UNREGISTERED || code == MessagingErrorCode.INVALID_ARGUMENT) {
            log.warn("FCM token invalid/unregistered ({}): {}", maskToken(token), code);
        } else {
            log.warn("FCM send failed for token {}: {} — {}", maskToken(token), code, e.getMessage());
        }
    }

    private String maskToken(String token) {
        if (token == null || token.length() < 12) return "***";
        return token.substring(0, 6) + "..." + token.substring(token.length() - 6);
    }
}
