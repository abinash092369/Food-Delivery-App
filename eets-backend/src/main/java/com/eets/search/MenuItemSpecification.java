package com.eets.search;

import com.eets.domain.MenuItem;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Builds a composable JPA Specification from a {@link MenuItemFilter}.
 */
public final class MenuItemSpecification {

    private MenuItemSpecification() {}

    public static Specification<MenuItem> from(MenuItemFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // ── Always show only available items ────────────────────────────
            predicates.add(cb.isTrue(root.get("isAvailable")));

            // ── keyword: matches name OR description ────────────────────────
            if (hasText(filter.getKeyword())) {
                String pattern = likePattern(filter.getKeyword());
                Predicate byName = cb.like(cb.lower(root.get("name")), pattern);
                Predicate byDesc = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(byName, byDesc));
            }

            // ── vegOnly ─────────────────────────────────────────────────────
            if (Boolean.TRUE.equals(filter.getVegOnly())) {
                predicates.add(cb.isTrue(root.get("isVeg")));
            }

            // ── minRating ───────────────────────────────────────────────────
            if (filter.getMinRating() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("avgRating"), filter.getMinRating()));
            }

            // ── price range ─────────────────────────────────────────────────
            if (filter.getMinPrice() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), filter.getMinPrice()));
            }
            if (filter.getMaxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), filter.getMaxPrice()));
            }

            // ── scoped to a single restaurant ───────────────────────────────
            if (filter.getRestaurantId() != null) {
                predicates.add(cb.equal(root.get("restaurantId"), filter.getRestaurantId()));
            }

            // ── scoped to a single category ─────────────────────────────────
            if (filter.getCategoryId() != null) {
                predicates.add(cb.equal(root.get("categoryId"), filter.getCategoryId()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }

    private static String likePattern(String value) {
        return "%" + value.toLowerCase() + "%";
    }
}
