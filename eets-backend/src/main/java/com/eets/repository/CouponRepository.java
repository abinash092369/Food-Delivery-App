package com.eets.repository;

import com.eets.domain.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {

    Optional<Coupon> findByCodeIgnoreCase(String code);
    Page<Coupon> findAll(Pageable pageable);
    List<Coupon> findByIsActiveTrueAndValidUntilAfter(java.time.Instant now);
}
