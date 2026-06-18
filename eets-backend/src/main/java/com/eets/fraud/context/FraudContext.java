package com.eets.fraud.context;

import lombok.Builder;
import lombok.Getter;
import java.time.Instant;
import java.util.List;
import com.eets.domain.*;

@Getter
@Builder
public class FraudContext {
    private final Instant scanStartTime;
    private final Instant checkWindowStart;
    
    // Pre-populated collections to reduce DB queries
    private final List<Order> recentOrders;
    private final List<CouponUsage> recentCouponUsages;
    private final List<DriverLocationHistory> recentLocations;
    private final List<DeliveryAssignment> recentAssignments;
}
