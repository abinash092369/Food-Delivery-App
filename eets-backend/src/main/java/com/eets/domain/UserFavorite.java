package com.eets.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_favorites")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserFavorite extends Auditable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FavoriteType type;

    @Column(name = "reference_id", nullable = false)
    private Long referenceId;
}
