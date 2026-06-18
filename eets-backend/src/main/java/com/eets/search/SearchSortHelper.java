package com.eets.search;

import org.springframework.data.domain.Sort;

/**
 * Translates the user-facing {@code sortBy} / {@code direction} strings into
 * Spring Data {@link Sort} objects for both Restaurant and MenuItem searches.
 *
 * <p>Distance sorting cannot be expressed as a JPA {@link Sort} (it requires
 * in-memory Haversine computation); the service layer handles that case after
 * the DB query.
 */
public final class SearchSortHelper {

    private SearchSortHelper() {}

    // ── Restaurant sort ───────────────────────────────────────────────────────

    /**
     * Converts filter sort params to a {@link Sort} for Restaurant queries.
     *
     * <ul>
     *   <li>{@code rating}      → avgRating DESC (default)</li>
     *   <li>{@code deliveryTime}→ deliveryTimeMin ASC</li>
     *   <li>{@code price}       → deliveryFee ASC</li>
     *   <li>{@code distance}    → returns UNSORTED (handled in-memory)</li>
     * </ul>
     */
    public static Sort restaurantSort(String sortBy, String direction) {
        String field = toRestaurantField(sortBy);
        if (field == null) {
            // distance sort: let DB return any order; service will sort in-memory
            return Sort.by(Sort.Direction.DESC, "avgRating");
        }
        Sort.Direction dir = resolveDirection(direction, defaultRestaurantDir(sortBy));
        return Sort.by(dir, field);
    }

    /** True when distance sort was requested and geo-coords must be used. */
    public static boolean isDistanceSort(String sortBy) {
        return "distance".equalsIgnoreCase(sortBy);
    }

    // ── MenuItem sort ─────────────────────────────────────────────────────────

    /**
     * Converts filter sort params to a {@link Sort} for MenuItem queries.
     *
     * <ul>
     *   <li>{@code rating} → avgRating DESC (default)</li>
     *   <li>{@code price}  → price ASC</li>
     *   <li>{@code name}   → name ASC</li>
     * </ul>
     */
    public static Sort menuItemSort(String sortBy, String direction) {
        String field = toMenuItemField(sortBy);
        Sort.Direction dir = resolveDirection(direction, defaultMenuItemDir(sortBy));
        return Sort.by(dir, field);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static String toRestaurantField(String sortBy) {
        if (sortBy == null) return "avgRating";
        return switch (sortBy.toLowerCase()) {
            case "rating"       -> "avgRating";
            case "deliverytime" -> "deliveryTimeMin";
            case "price"        -> "deliveryFee";
            case "distance"     -> null;   // in-memory
            default             -> "avgRating";
        };
    }

    private static Sort.Direction defaultRestaurantDir(String sortBy) {
        if (sortBy == null) return Sort.Direction.DESC;
        return switch (sortBy.toLowerCase()) {
            case "rating"   -> Sort.Direction.DESC;
            default         -> Sort.Direction.ASC;
        };
    }

    private static String toMenuItemField(String sortBy) {
        if (sortBy == null) return "avgRating";
        return switch (sortBy.toLowerCase()) {
            case "rating" -> "avgRating";
            case "price"  -> "price";
            case "name"   -> "name";
            default       -> "avgRating";
        };
    }

    private static Sort.Direction defaultMenuItemDir(String sortBy) {
        if (sortBy == null) return Sort.Direction.DESC;
        return switch (sortBy.toLowerCase()) {
            case "rating" -> Sort.Direction.DESC;
            default       -> Sort.Direction.ASC;
        };
    }

    private static Sort.Direction resolveDirection(String direction, Sort.Direction defaultDir) {
        if ("asc".equalsIgnoreCase(direction))  return Sort.Direction.ASC;
        if ("desc".equalsIgnoreCase(direction)) return Sort.Direction.DESC;
        return defaultDir;
    }
}
