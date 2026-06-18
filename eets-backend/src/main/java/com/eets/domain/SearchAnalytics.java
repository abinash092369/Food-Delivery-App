package com.eets.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "search_analytics")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SearchAnalytics {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String keyword;

    @Column(name = "search_count", nullable = false)
    @Builder.Default
    private Integer searchCount = 1;

    @Column(name = "total_results", nullable = false)
    @Builder.Default
    private Integer totalResults = 0;

    @Column(name = "conversion_count", nullable = false)
    @Builder.Default
    private Integer conversionCount = 0;

    @Column(name = "conversion_rate", nullable = false)
    @Builder.Default
    private Double conversionRate = 0.0;

    @Column(name = "last_searched_at", nullable = false)
    private Instant lastSearchedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        lastSearchedAt = Instant.now();
        if (searchCount != null && searchCount > 0) {
            conversionRate = (double) (conversionCount == null ? 0 : conversionCount) / searchCount;
        } else {
            conversionRate = 0.0;
        }
    }
}
