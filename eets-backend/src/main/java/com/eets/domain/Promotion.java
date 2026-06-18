package com.eets.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "promotions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Promotion extends Auditable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id", nullable = false)
    private Long restaurantId;

    @Column(length = 40)
    private String type;

    @Column(precision = 10, scale = 2)
    private BigDecimal value;

    @Column(name = "min_order", precision = 10, scale = 2)
    private BigDecimal minOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "applicable_to")
    private ApplicableTo applicableTo = ApplicableTo.ALL;

    @Column(name = "applicable_id")
    private Long applicableId;

    @Column(name = "banner_url", length = 500)
    private String bannerUrl;

    @Column(name = "usage_limit")
    private Integer usageLimit;
    @Column(name = "current_usage")
    private Integer currentUsage = 0;

    @Column(name = "valid_from")
    private Instant validFrom;
    @Column(name = "valid_until")
    private Instant validUntil;

    @Column(name = "is_active")
    private Boolean isActive = true;
}
