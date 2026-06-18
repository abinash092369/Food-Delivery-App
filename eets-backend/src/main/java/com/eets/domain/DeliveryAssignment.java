package com.eets.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "delivery_assignments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DeliveryAssignment extends Auditable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, unique = true)
    private Long orderId;

    @Column(name = "driver_id", nullable = false)
    private Long driverId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssignmentStatus status;

    @Column(name = "assigned_at")
    private Instant assignedAt;
    @Column(name = "accepted_at")
    private Instant acceptedAt;
    @Column(name = "picked_up_at")
    private Instant pickedUpAt;
    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @Column(name = "pickup_otp", length = 6)
    private String pickupOtp;
    @Column(name = "delivery_otp", length = 6)
    private String deliveryOtp;

    @Column(name = "distance_km")
    private Double distanceKm;

    @Column(name = "earnings_amount", precision = 10, scale = 2)
    private BigDecimal earningsAmount;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "route_polyline", columnDefinition = "TEXT")
    private String routePolyline;

    @Column(name = "estimated_duration_min")
    private Integer estimatedDurationMin;

    @Column(name = "route_distance_km")
    private Double routeDistanceKm;

    @Column(name = "route_generated_at")
    private Instant routeGeneratedAt;
}
