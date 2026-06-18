package com.eets.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "driver_location_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DriverLocationHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "driver_id", nullable = false)
    private Long driverId;

    @Column(nullable = false)
    private Double lat;

    @Column(nullable = false)
    private Double lng;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    @Column(name = "order_id")
    private Long orderId;
}
