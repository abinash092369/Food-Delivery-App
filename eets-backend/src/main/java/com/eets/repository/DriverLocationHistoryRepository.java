package com.eets.repository;

import com.eets.domain.DriverLocationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriverLocationHistoryRepository extends JpaRepository<DriverLocationHistory, Long> {
    List<DriverLocationHistory> findByDriverIdOrderByRecordedAtDesc(Long driverId);
    List<DriverLocationHistory> findByOrderIdOrderByRecordedAtDesc(Long orderId);
    List<DriverLocationHistory> findByRecordedAtAfterOrderByRecordedAtAsc(java.time.Instant after);
}
