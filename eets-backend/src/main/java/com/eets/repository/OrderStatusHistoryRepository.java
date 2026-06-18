package com.eets.repository;

import com.eets.domain.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory, Long> {

    List<OrderStatusHistory> findByOrderIdOrderByChangedAtAsc(Long orderId);
    List<OrderStatusHistory> findByOrderIdIn(Collection<Long> orderIds);
}
