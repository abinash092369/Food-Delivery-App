package com.eets.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "carts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Cart extends Auditable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "restaurant_id")
    private Long restaurantId;

    @Column(name = "coupon_id")
    private Long couponId;
}
