package com.eets.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "coupon_usage")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CouponUsage extends Auditable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "coupon_id", nullable = false)
    private Long couponId;
    @Column(name = "user_id", nullable = false)
    private Long userId;
    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "discount_applied", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountApplied;
}
