package com.eets.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notification_preferences")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationPreference extends Auditable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    private Boolean push = true;
    private Boolean email = true;
    private Boolean sms = true;

    @Column(name = "order_updates")
    private Boolean orderUpdates = true;

    private Boolean promotions = true;
}
