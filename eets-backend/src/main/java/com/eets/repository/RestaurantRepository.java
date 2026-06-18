package com.eets.repository;

import com.eets.domain.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long>, JpaSpecificationExecutor<Restaurant> {

    Optional<Restaurant> findBySlug(String slug);
    Optional<Restaurant> findByOwnerId(Long ownerId);
    boolean existsBySlug(String slug);
    Page<Restaurant> findByIsApprovedTrueAndIsActiveTrue(Pageable pageable);
    Page<Restaurant> findByIsApprovedFalseAndRejectionReasonIsNull(Pageable pageable);
    @Query("SELECT r FROM Restaurant r WHERE r.isApproved = true AND r.isActive = true " +
           "AND (:city IS NULL OR LOWER(r.city) = LOWER(:city)) " +
           "AND (:q IS NULL OR LOWER(r.name) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(r.cuisineTypes) LIKE LOWER(CONCAT('%',:q,'%')))")
    Page<Restaurant> searchPublic(@Param("city") String city, @Param("q") String q, Pageable pageable);
    @Query("SELECT r FROM Restaurant r WHERE (:q IS NULL OR LOWER(r.name) LIKE LOWER(CONCAT('%',:q,'%')))")
    Page<Restaurant> searchAdmin(@Param("q") String q, Pageable pageable);
    long countByIsActiveTrue();

    @Query(value = "SELECT *, (6371 * acos(cos(radians(:lat)) * cos(radians(lat)) * cos(radians(lng) - radians(:lng)) + sin(radians(:lat)) * sin(radians(lat)))) AS distance FROM restaurants WHERE is_active = 1 HAVING distance <= :radiusKm ORDER BY distance ASC LIMIT :limit OFFSET :offset", nativeQuery = true)
    List<Restaurant> findNearbyRestaurants(@Param("lat") double lat, @Param("lng") double lng, @Param("radiusKm") double radiusKm, @Param("limit") int limit, @Param("offset") int offset);

    @Query(value = "SELECT COUNT(*) FROM (SELECT (6371 * acos(cos(radians(:lat)) * cos(radians(lat)) * cos(radians(lng) - radians(:lng)) + sin(radians(:lat)) * sin(radians(lat)))) AS distance FROM restaurants WHERE is_active = 1 HAVING distance <= :radiusKm) AS temp", nativeQuery = true)
    long countNearbyRestaurants(@Param("lat") double lat, @Param("lng") double lng, @Param("radiusKm") double radiusKm);
}
