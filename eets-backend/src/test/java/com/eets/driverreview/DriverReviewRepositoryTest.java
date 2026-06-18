package com.eets.driverreview;

import com.eets.domain.DriverReview;
import com.eets.repository.DriverReviewRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

/**
 * DataJPA slice tests for {@link DriverReviewRepository}.
 *
 * Uses H2 in-memory database (auto-configured by Spring Boot test slice).
 * Flyway migrations are NOT run here; schema is created by Hibernate's
 * {@code spring.jpa.hibernate.ddl-auto=create-drop} in test context.
 *
 * Verify:
 * <ul>
 *   <li>findByOrderId</li>
 *   <li>findByDriverIdOrderByCreatedAtDesc pagination</li>
 *   <li>avgRatingForDriver aggregate</li>
 *   <li>countByDriverId</li>
 * </ul>
 */
@DataJpaTest
@ActiveProfiles("test")
class DriverReviewRepositoryTest {

    @Autowired
    DriverReviewRepository repo;

    // ── helpers ───────────────────────────────────────────────────────────────

    private DriverReview save(Long orderId, Long driverId, Long customerId, int rating) {
        return repo.save(DriverReview.builder()
                .orderId(orderId)
                .driverId(driverId)
                .customerId(customerId)
                .rating(rating)
                .comment("test comment")
                .build());
    }

    // ── tests ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("findByOrderId returns saved review")
    void findByOrderId_found() {
        save(100L, 1L, 10L, 5);
        Optional<DriverReview> result = repo.findByOrderId(100L);
        assertThat(result).isPresent();
        assertThat(result.get().getRating()).isEqualTo(5);
    }

    @Test
    @DisplayName("findByOrderId returns empty for unknown orderId")
    void findByOrderId_notFound() {
        assertThat(repo.findByOrderId(999L)).isEmpty();
    }

    @Test
    @DisplayName("findByDriverIdOrderByCreatedAtDesc returns all reviews for driver")
    void findByDriverId_paginates() {
        save(101L, 2L, 11L, 4);
        save(102L, 2L, 12L, 3);
        save(103L, 3L, 13L, 5); // different driver

        Page<DriverReview> page = repo.findByDriverIdOrderByCreatedAtDesc(2L, PageRequest.of(0, 10));
        assertThat(page.getTotalElements()).isEqualTo(2);
        assertThat(page.getContent()).allMatch(r -> r.getDriverId().equals(2L));
    }

    @Test
    @DisplayName("avgRatingForDriver computes correct average")
    void avgRating_correct() {
        save(201L, 5L, 20L, 4);
        save(202L, 5L, 21L, 2);  // avg should be 3.0

        Double avg = repo.avgRatingForDriver(5L);
        assertThat(avg).isNotNull().isEqualTo(3.0);
    }

    @Test
    @DisplayName("avgRatingForDriver returns null when no reviews exist")
    void avgRating_null_whenNoReviews() {
        assertThat(repo.avgRatingForDriver(999L)).isNull();
    }

    @Test
    @DisplayName("countByDriverId returns 0 for driver with no reviews")
    void countByDriverId_zero() {
        assertThat(repo.countByDriverId(888L)).isZero();
    }

    @Test
    @DisplayName("countByDriverId returns correct count")
    void countByDriverId_count() {
        save(301L, 6L, 30L, 5);
        save(302L, 6L, 31L, 4);
        assertThat(repo.countByDriverId(6L)).isEqualTo(2);
    }

    @Test
    @DisplayName("unique constraint on order_id prevents duplicate reviews")
    void uniqueConstraint_orderIdIsUnique() {
        save(401L, 7L, 40L, 5);
        assertThatCode(() -> save(401L, 7L, 41L, 3))
                .as("Second review on same order should throw")
                .isInstanceOf(Exception.class);  // DataIntegrityViolationException at flush time
    }
}
