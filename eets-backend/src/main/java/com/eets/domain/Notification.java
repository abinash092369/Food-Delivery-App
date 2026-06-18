package com.eets.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification extends Auditable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 1000)
    private String body;

    @Column(length = 50)
    private String type;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "is_read")
    private Boolean isRead = false;

    @Column(name = "sent_via", columnDefinition = "json")
    private String sentVia;
}
