package com.eets.repository;

import com.eets.domain.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long>, JpaSpecificationExecutor<MenuItem> {

    List<MenuItem> findByRestaurantId(Long restaurantId);
    List<MenuItem> findByCategoryId(Long categoryId);
    @Query("SELECT m FROM MenuItem m WHERE m.isAvailable = true AND " +
           "(LOWER(m.name) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(m.description) LIKE LOWER(CONCAT('%',:q,'%')))")
    Page<MenuItem> search(@Param("q") String q, Pageable pageable);
    boolean existsByRestaurantIdAndIsVegTrueAndIsAvailableTrue(Long restaurantId);
}
