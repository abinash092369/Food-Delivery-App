package com.eets.search;

import lombok.Data;
import org.springframework.web.bind.annotation.RequestParam;

import java.math.BigDecimal;

/**
 * Collects all filter + sort parameters for /api/search/restaurants.
 *
 * Bound via @ModelAttribute in the controller so every field maps to a query-string param.
 */
@Data
public class RestaurantFilter {

    /** Free-text: matches name or cuisine types */
    private String keyword;

    /** Exact-match cuisine type, case-insensitive */
    private String cuisine;

    /** If true, only restaurants that have at least one veg menu item are returned.
     *  (Implemented at specification level by checking for veg items in restaurant.) */
    private Boolean vegOnly;

    /** Minimum average rating (0–5) */
    private Double minRating;

    /** Maximum delivery time in minutes */
    private Integer maxDeliveryTime;

    /** Minimum delivery fee filter */
    private BigDecimal minPrice;

    /** Maximum delivery fee filter */
    private BigDecimal maxPrice;

    // ── Sorting ──────────────────────────────────────────────────────────────
    /**
     * Allowed values: rating | deliveryTime | price | distance
     * Defaults to rating when not provided.
     */
    private String sortBy;

    /**
     * asc | desc  (default: desc for rating; asc for everything else)
     */
    private String direction;

    // ── Geo ──────────────────────────────────────────────────────────────────
    /** Caller latitude – required for distance sorting */
    private Double lat;

    /** Caller longitude – required for distance sorting */
    private Double lng;

    // ── Pagination ───────────────────────────────────────────────────────────
    private int page = 0;
    private int size = 10;
}
