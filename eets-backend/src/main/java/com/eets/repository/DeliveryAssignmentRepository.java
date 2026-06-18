package com.eets.repository;

import com.eets.domain.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface DeliveryAssignmentRepository extends JpaRepository<DeliveryAssignment, Long> {

    Optional<DeliveryAssignment> findByOrderId(Long orderId);
    long countByOrderIdAndStatus(Long orderId, AssignmentStatus status);
    Optional<DeliveryAssignment> findFirstByDriverIdAndStatusInOrderByCreatedAtDesc(Long driverId, List<AssignmentStatus> statuses);
    long countByDriverIdAndStatus(Long driverId, AssignmentStatus status);
    Page<DeliveryAssignment> findByDriverIdOrderByCreatedAtDesc(Long driverId, Pageable pageable);
    List<DeliveryAssignment> findByDriverIdAndStatus(Long driverId, AssignmentStatus status);
    List<DeliveryAssignment> findByStatusAndAssignedAtBefore(AssignmentStatus status, java.time.Instant before);
    List<DeliveryAssignment> findByCreatedAtAfter(java.time.Instant after);
    List<DeliveryAssignment> findByDriverIdAndCreatedAtAfter(Long driverId, java.time.Instant after);
}
