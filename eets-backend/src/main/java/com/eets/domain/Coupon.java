package com.eets.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "coupons")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Coupon extends Auditable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CouponType type;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal value;

    @Column(name = "max_discount", precision = 10, scale = 2)
    private BigDecimal maxDiscount;

    @Column(name = "min_order_amount", precision = 10, scale = 2)
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    @Column(name = "usage_limit_per_user")
    private Integer usageLimitPerUser = 1;
    @Column(name = "total_usage_limit")
    private Integer totalUsageLimit;
    @Column(name = "current_usage")
    private Integer currentUsage = 0;

    @Column(name = "valid_from")
    private Instant validFrom;
    @Column(name = "valid_until")
    private Instant validUntil;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "applicable_restaurant_id")
    private Long applicableRestaurantId;

    @Column(name = "created_by_id")
    private Long createdById;
}
