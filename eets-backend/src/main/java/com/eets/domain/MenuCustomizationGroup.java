package com.eets.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "menu_customization_groups")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MenuCustomizationGroup extends Auditable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "menu_item_id", nullable = false)
    private Long menuItemId;

    @Column(nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CustomizationType type;

    @Column(name = "is_required")
    private Boolean isRequired = false;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;
}
