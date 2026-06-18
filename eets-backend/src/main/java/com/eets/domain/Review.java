package com.eets.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "reviews")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Review extends Auditable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, unique = true)
    private Long orderId;
    @Column(name = "user_id", nullable = false)
    private Long userId;
    @Column(name = "restaurant_id", nullable = false)
    private Long restaurantId;

    @Column(nullable = false)
    private Integer rating;

    @Column(name = "review_text", columnDefinition = "TEXT")
    private String reviewText;

    @Column(columnDefinition = "json")
    private String images;

    @Column(name = "is_visible")
    private Boolean isVisible = true;
}
