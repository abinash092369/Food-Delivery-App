package com.eets.domain;

import com.eets.event.MenuItemEntityListener;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "menu_items")
@EntityListeners(MenuItemEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MenuItem extends Auditable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id", nullable = false)
    private Long restaurantId;
    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Column(nullable = false, length = 180)
    private String name;
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "image_url", length = 500)
    private String imageUrl;
    @Column(name = "is_veg")
    private Boolean isVeg = true;
    @Column(name = "is_available")
    private Boolean isAvailable = true;
    @Column(name = "is_featured")
    private Boolean isFeatured = false;
    @Column(name = "is_recommended")
    private Boolean isRecommended = false;
    @Column(name = "total_orders")
    private Integer totalOrders = 0;
    @Column(name = "avg_rating")
    private Double avgRating = 0.0;

    @Column(name = "tags", length = 500)
    private String tags;
}
