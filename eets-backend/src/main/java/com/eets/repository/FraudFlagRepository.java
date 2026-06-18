package com.eets.repository;

import com.eets.domain.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface FraudFlagRepository extends JpaRepository<FraudFlag, Long> {

    Page<FraudFlag> findByStatus(FraudStatus status, Pageable pageable);
    boolean existsByUserIdAndFlagTypeAndStatus(Long userId, String flagType, FraudStatus status);
    long countByStatus(FraudStatus status);
    List<FraudFlag> findByUserIdAndStatus(Long userId, FraudStatus status);
    List<FraudFlag> findByUserId(Long userId);

    @Query("SELECT f.flagType, COUNT(f) FROM FraudFlag f GROUP BY f.flagType")
    List<Object[]> countFlagsByType();
}
