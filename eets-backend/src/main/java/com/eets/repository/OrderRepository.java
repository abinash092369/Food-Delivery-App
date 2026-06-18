package com.eets.repository;

import com.eets.domain.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;

import java.util.*;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.id = :id")
    Optional<Order> findByIdForUpdate(@Param("id") Long id);

    Optional<Order> findByRazorpayOrderId(String razorpayOrderId);
    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<Order> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId, Pageable pageable);
    Page<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status, Pageable pageable);
    @Query("SELECT o FROM Order o WHERE o.status IN (com.eets.domain.OrderStatus.ACCEPTED, com.eets.domain.OrderStatus.PREPARING) AND o.deliveryPartnerId IS NULL AND o.createdAt < :before")
    Page<Order> findOrdersNeedingDriverAssignment(@Param("before") java.time.Instant before, Pageable pageable);
    List<Order> findTop50ByCreatedAtAfterOrderByCreatedAtDesc(java.time.Instant after);
    List<Order> findByCreatedAtAfter(java.time.Instant after);
    Page<Order> findByCreatedAtAfter(java.time.Instant after, Pageable pageable);
    Page<Order> findByCreatedAtAfterAndStatus(java.time.Instant after, OrderStatus status, Pageable pageable);
    Page<Order> findByStatusAndCreatedAtAfter(OrderStatus status, java.time.Instant after, Pageable pageable);
    long countByCreatedAtAfter(java.time.Instant after);
    long countByStatusInAndCreatedAtAfter(java.util.List<OrderStatus> statuses, java.time.Instant after);
    @Query("SELECT COALESCE(SUM(o.totalAmount),0) FROM Order o WHERE o.paymentStatus = com.eets.domain.PaymentStatus.PAID AND o.createdAt >= :from")
    java.math.BigDecimal sumPaidSince(@Param("from") java.time.Instant from);
    @Query("SELECT o FROM Order o WHERE o.status IN (com.eets.domain.OrderStatus.ACCEPTED, com.eets.domain.OrderStatus.PREPARING, com.eets.domain.OrderStatus.PACKED) AND o.deliveryPartnerId IS NULL")
    List<Order> findUnassignedOrders();
    @Query("SELECT o FROM Order o WHERE o.userId = :uid AND o.status = com.eets.domain.OrderStatus.CANCELLED AND o.createdAt >= :since")
    List<Order> findCancelledByUserSince(@Param("uid") Long uid, @Param("since") java.time.Instant since);
    long countByUserId(Long userId);
}
