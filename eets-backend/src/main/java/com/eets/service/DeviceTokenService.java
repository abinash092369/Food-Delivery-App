package com.eets.service;

import com.eets.domain.DeviceToken;
import com.eets.dto.request.DeviceTokenRequest;
import com.eets.dto.response.DeviceTokenResponse;
import com.eets.repository.DeviceTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Manages FCM device tokens for multi-device push notification support.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DeviceTokenService {

    private final DeviceTokenRepository deviceTokens;

    // -------------------------------------------------------------------------
    // Registration
    // -------------------------------------------------------------------------

    /**
     * Registers (or refreshes) a device token for the given user.
     * If the token already exists for this user it is reactivated and updated.
     */
    @Transactional
    public DeviceTokenResponse registerToken(Long userId, DeviceTokenRequest request) {
        Optional<DeviceToken> existing = deviceTokens.findByUserIdAndToken(userId, request.token());
        DeviceToken dt;
        if (existing.isPresent()) {
            dt = existing.get();
            dt.setIsActive(true);
            dt.setLastUsedAt(Instant.now());
            if (request.platform() != null)    dt.setPlatform(request.platform().toUpperCase());
            if (request.deviceName() != null)  dt.setDeviceName(request.deviceName());
        } else {
            dt = DeviceToken.builder()
                    .userId(userId)
                    .token(request.token())
                    .platform(request.platform() != null ? request.platform().toUpperCase() : null)
                    .deviceName(request.deviceName())
                    .isActive(true)
                    .lastUsedAt(Instant.now())
                    .build();
        }
        dt = deviceTokens.save(dt);
        log.info("Device token registered for userId={}", userId);
        return toResponse(dt);
    }

    // -------------------------------------------------------------------------
    // Removal
    // -------------------------------------------------------------------------

    /**
     * Permanently removes a device token (e.g. on logout from that device).
     */
    @Transactional
    public void removeToken(Long userId, String token) {
        deviceTokens.deleteByUserIdAndToken(userId, token);
        log.info("Device token removed for userId={}", userId);
    }

    /**
     * Deactivates (soft-delete) all tokens for a user.
     */
    @Transactional
    public void deactivateAllTokens(Long userId) {
        deviceTokens.deactivateAllByUserId(userId);
    }

    // -------------------------------------------------------------------------
    // Queries (used by NotificationService for push delivery)
    // -------------------------------------------------------------------------

    public List<String> getActiveTokens(Long userId) {
        return deviceTokens.findActiveTokensByUserId(userId);
    }

    public List<String> getActiveTokensForUsers(List<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) return List.of();
        return deviceTokens.findActiveTokensByUserIds(userIds);
    }

    // -------------------------------------------------------------------------
    // Cleanup of invalid tokens (called after FCM batch-send detects failures)
    // -------------------------------------------------------------------------

    @Transactional
    public void removeInvalidTokens(List<String> badTokens) {
        if (badTokens == null || badTokens.isEmpty()) return;
        badTokens.forEach(token ->
            deviceTokens.findAll().stream()
                .filter(dt -> dt.getToken().equals(token))
                .forEach(dt -> {
                    dt.setIsActive(false);
                    deviceTokens.save(dt);
                    log.info("Deactivated invalid FCM token for userId={}", dt.getUserId());
                })
        );
    }

    // -------------------------------------------------------------------------
    // Internal helper
    // -------------------------------------------------------------------------

    private DeviceTokenResponse toResponse(DeviceToken dt) {
        return new DeviceTokenResponse(
                dt.getId(),
                dt.getToken(),
                dt.getPlatform(),
                dt.getDeviceName(),
                dt.getIsActive(),
                dt.getLastUsedAt(),
                dt.getCreatedAt()
        );
    }
}
