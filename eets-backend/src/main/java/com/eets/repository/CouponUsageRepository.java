package com.eets.repository;

import com.eets.domain.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface CouponUsageRepository extends JpaRepository<CouponUsage, Long> {

    long countByCouponIdAndUserId(Long couponId, Long userId);
    List<CouponUsage> findByCreatedAtAfter(java.time.Instant after);
}
