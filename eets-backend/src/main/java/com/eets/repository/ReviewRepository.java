package com.eets.repository;

import com.eets.domain.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    Optional<Review> findByOrderId(Long orderId);
    Page<Review> findByRestaurantIdAndIsVisibleTrue(Long restaurantId, Pageable pageable);
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.restaurantId = :rid AND r.isVisible = true")
    Double avgRatingForRestaurant(@Param("rid") Long rid);
    long countByRestaurantIdAndIsVisibleTrue(Long rid);
}
