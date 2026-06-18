package com.eets.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User extends Auditable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, unique = true, length = 180)
    private String email;

    @Column(unique = true, length = 20)
    private String phone;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Column(name = "is_email_verified")
    private Boolean isEmailVerified = false;

    @Column(name = "is_phone_verified")
    private Boolean isPhoneVerified = false;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "is_banned")
    private Boolean isBanned = false;

    @Column(name = "ban_reason", length = 500)
    private String banReason;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "fraud_risk_score", nullable = false, length = 20)
    private FraudRiskScore fraudRiskScore = FraudRiskScore.LOW;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(name = "google_id", length = 120)
    private String googleId;

    @Column(name = "fcm_token", length = 500)
    private String fcmToken;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;
}
