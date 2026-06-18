package com.eets.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "fraud_flags")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FraudFlag extends Auditable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "flag_type", nullable = false, length = 60)
    private String flagType;

    @Column(name = "risk_score")
    private Integer riskScore;

    @Column(columnDefinition = "json")
    private String details;

    @Enumerated(EnumType.STRING)
    private FraudStatus status = FraudStatus.OPEN;

    @Column(name = "flagged_at")
    private Instant flaggedAt;

    @Column(name = "reviewed_by_id")
    private Long reviewedById;
}
