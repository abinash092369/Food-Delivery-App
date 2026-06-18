package com.eets.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "cart_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CartItem extends Auditable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cart_id", nullable = false)
    private Long cartId;

    @Column(name = "menu_item_id", nullable = false)
    private Long menuItemId;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "selected_options", columnDefinition = "json")
    private String selectedOptions;

    @Column(name = "item_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal itemPrice;

    @Column(name = "total_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;
}
