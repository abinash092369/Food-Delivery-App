package com.eets.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Persisted FCM device token per user.
 * Supports multi-device: one user may have many tokens (phone + tablet + web).
 */
@Entity
@Table(
    name = "device_tokens",
    uniqueConstraints = @UniqueConstraint(name = "uq_device_token", columnNames = {"user_id", "token"}),
    indexes = {
        @Index(name = "idx_dt_user_id", columnList = "user_id"),
        @Index(name = "idx_dt_token",   columnList = "token")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DeviceToken extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** FCM registration token — up to 4096 chars. */
    @Column(nullable = false, length = 4096)
    private String token;

    /** Optional: 'ANDROID', 'IOS', 'WEB' */
    @Column(length = 20)
    private String platform;

    /** Optional: human-readable device label (e.g. "Pixel 8"). */
    @Column(name = "device_name", length = 120)
    private String deviceName;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "last_used_at")
    private Instant lastUsedAt;
}
