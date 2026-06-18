package com.eets.domain;

import com.eets.event.MenuCategoryEntityListener;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "menu_categories")
@EntityListeners(MenuCategoryEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MenuCategory extends Auditable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id", nullable = false)
    private Long restaurantId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "is_available")
    private Boolean isAvailable = true;
}
