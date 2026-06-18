package com.eets.search;

import com.eets.domain.MenuItem;
import com.eets.domain.Restaurant;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Builds a composable JPA Specification from a {@link RestaurantFilter}.
 * <p>
 * All predicates are AND-combined so every supplied filter must be satisfied.
 */
public final class RestaurantSpecification {

    private RestaurantSpecification() {}

    /**
     * Returns a Specification that enforces:
     * <ul>
     *   <li>isApproved = true</li>
     *   <li>isActive   = true</li>
     *   <li>+ every non-null field in {@code filter}</li>
     * </ul>
     */
    public static Specification<Restaurant> from(RestaurantFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // ── Mandatory public-visibility predicates ──────────────────────
            predicates.add(cb.isTrue(root.get("isApproved")));
            predicates.add(cb.isTrue(root.get("isActive")));

            // ── keyword: matches name OR cuisineTypes ───────────────────────
            if (hasText(filter.getKeyword())) {
                String pattern = likePattern(filter.getKeyword());
                Predicate byName    = cb.like(cb.lower(root.get("name")), pattern);
                Predicate byCuisine = cb.like(cb.lower(root.get("cuisineTypes")), pattern);
                predicates.add(cb.or(byName, byCuisine));
            }

            // ── cuisine: exact-contains inside JSON column ──────────────────
            if (hasText(filter.getCuisine())) {
                String pattern = likePattern(filter.getCuisine());
                predicates.add(cb.like(cb.lower(root.get("cuisineTypes")), pattern));
            }

            // ── minRating ───────────────────────────────────────────────────
            if (filter.getMinRating() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("avgRating"), filter.getMinRating()));
            }

            // ── maxDeliveryTime ─────────────────────────────────────────────
            if (filter.getMaxDeliveryTime() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("deliveryTimeMin"), filter.getMaxDeliveryTime()));
            }

            // ── price range (delivery fee) ──────────────────────────────────
            if (filter.getMinPrice() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("deliveryFee"), filter.getMinPrice()));
            }
            if (filter.getMaxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("deliveryFee"), filter.getMaxPrice()));
            }

            // ── vegOnly: subquery — restaurant must have ≥1 veg item ────────
            if (Boolean.TRUE.equals(filter.getVegOnly())) {
                Subquery<Long> vegSub = query.subquery(Long.class);
                Root<MenuItem> itemRoot = vegSub.from(MenuItem.class);
                vegSub.select(cb.literal(1L))
                      .where(
                          cb.equal(itemRoot.get("restaurantId"), root.get("id")),
                          cb.isTrue(itemRoot.get("isVeg")),
                          cb.isTrue(itemRoot.get("isAvailable"))
                      );
                predicates.add(cb.exists(vegSub));
            }

            // ── avoid duplicates when subquery is present ───────────────────
            if (query.getResultType() != Long.class) {
                query.distinct(true);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }

    private static String likePattern(String value) {
        return "%" + value.toLowerCase() + "%";
    }
}
