package com.eets.repository;

import com.eets.domain.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId, Pageable pageable);
    long countByUserIdAndIsReadFalse(Long userId);
}
