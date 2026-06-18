package com.eets.repository;

import com.eets.domain.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface DeliveryPartnerRepository extends JpaRepository<DeliveryPartner, Long> {

    Optional<DeliveryPartner> findByUserId(Long userId);
    List<DeliveryPartner> findByIsOnlineTrueAndIsVerifiedTrue();
    Page<DeliveryPartner> findAll(Pageable pageable);
    long countByIsOnlineTrue();

    @Query(value = "SELECT dp.* FROM delivery_partners dp " +
                   "JOIN users u ON dp.user_id = u.id " +
                   "WHERE dp.is_online = true AND dp.is_verified = true " +
                   "AND u.is_active = true AND u.is_banned = false " +
                   "AND dp.current_lat IS NOT NULL AND dp.current_lng IS NOT NULL " +
                   "AND ST_Distance_Sphere(POINT(dp.current_lng, dp.current_lat), POINT(:lng, :lat)) <= :radiusMeters",
           nativeQuery = true)
    List<DeliveryPartner> findAvailableDriversNearby(
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radiusMeters") double radiusMeters);
}
