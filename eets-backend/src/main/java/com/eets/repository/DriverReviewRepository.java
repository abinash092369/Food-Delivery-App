package com.eets.repository;

import com.eets.domain.DriverReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DriverReviewRepository extends JpaRepository<DriverReview, Long> {

    /** Used to enforce the one-review-per-order rule. */
    Optional<DriverReview> findByOrderId(Long orderId);

    /** Paginated reviews for a driver profile / public listing. */
    Page<DriverReview> findByDriverIdOrderByCreatedAtDesc(Long driverId, Pageable pageable);

    /** Fetch the single review attached to an order (if any). */
    Optional<DriverReview> findByOrderIdAndCustomerId(Long orderId, Long customerId);

    /** Compute the average star rating for a driver (null if no reviews). */
    @Query("SELECT AVG(dr.rating) FROM DriverReview dr WHERE dr.driverId = :driverId")
    Double avgRatingForDriver(@Param("driverId") Long driverId);

    /** Count total ratings so DeliveryPartner.totalRatings stays accurate. */
    long countByDriverId(Long driverId);
}
