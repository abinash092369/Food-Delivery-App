package com.eets.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "menu_customization_options")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MenuCustomizationOption extends Auditable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id", nullable = false)
    private Long groupId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "extra_price", precision = 10, scale = 2)
    private BigDecimal extraPrice = BigDecimal.ZERO;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;
}
