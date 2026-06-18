package com.eets.search;

import lombok.Data;

import java.math.BigDecimal;

/**
 * Collects all filter + sort parameters for /api/search/menu-items.
 */
@Data
public class MenuItemFilter {

    /** Free-text: matches name or description */
    private String keyword;

    /** If true, only vegetarian items are returned */
    private Boolean vegOnly;

    /** Minimum average rating */
    private Double minRating;

    /** Minimum price */
    private BigDecimal minPrice;

    /** Maximum price */
    private BigDecimal maxPrice;

    /** Filter by restaurant id */
    private Long restaurantId;

    /** Filter by category id */
    private Long categoryId;

    // ── Sorting ──────────────────────────────────────────────────────────────
    /**
     * Allowed values: rating | price | name
     * Defaults to rating when not provided.
     */
    private String sortBy;

    /** asc | desc  (default: desc for rating; asc for price/name) */
    private String direction;

    // ── Pagination ───────────────────────────────────────────────────────────
    private int page = 0;
    private int size = 10;
}
