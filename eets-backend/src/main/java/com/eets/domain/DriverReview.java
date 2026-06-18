package com.eets.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Represents a customer's rating and optional comment for a delivery driver,
 * scoped to a single delivered order.
 *
 * <ul>
 *   <li>One review per order (enforced by DB unique constraint + service check)</li>
 *   <li>Only the customer who placed the order may create the review</li>
 *   <li>Only orders in {@link OrderStatus#DELIVERED} status are reviewable</li>
 *   <li>Only the driver assigned to that order may be reviewed</li>
 * </ul>
 */
@Entity
@Table(
    name = "driver_reviews",
    uniqueConstraints = @UniqueConstraint(name = "uq_driver_review_order", columnNames = "order_id")
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DriverReview extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The order this review is attached to (1:1). */
    @Column(name = "order_id", nullable = false, unique = true)
    private Long orderId;

    /** The {@link DeliveryPartner#id} of the driver being reviewed. */
    @Column(name = "driver_id", nullable = false)
    private Long driverId;

    /** The {@link User#id} of the customer submitting the review. */
    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    /**
     * Star rating from 1 (worst) to 5 (best).
     * Validated at the application layer; also constrained by DB CHECK.
     */
    @Min(1) @Max(5)
    @Column(nullable = false)
    private Integer rating;

    /** Optional written feedback (stored as TEXT). */
    @Column(columnDefinition = "TEXT")
    private String comment;
}
