package com.eets.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "order_status_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderStatusHistory extends Auditable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(nullable = false, length = 40)
    private String status;

    @Column(name = "changed_by_id")
    private Long changedById;

    @Column(name = "changed_at")
    private Instant changedAt;

    @Column(length = 500)
    private String notes;
}
