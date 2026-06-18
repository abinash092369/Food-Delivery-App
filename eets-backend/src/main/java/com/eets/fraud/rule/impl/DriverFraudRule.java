package com.eets.fraud.rule.impl;

import com.eets.domain.*;
import com.eets.fraud.context.FraudContext;
import com.eets.fraud.model.RuleResult;
import com.eets.fraud.rule.FraudRule;
import com.eets.repository.DeliveryAssignmentRepository;
import com.eets.repository.DeliveryPartnerRepository;
import com.eets.repository.DriverLocationHistoryRepository;
import com.eets.service.FraudThresholdService;
import com.eets.util.HaversineUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class DriverFraudRule implements FraudRule {

    private final DeliveryPartnerRepository driverRepo;
    private final FraudThresholdService thresholdService;

    @Override
    public String getName() {
        return "DRIVER_FRAUD";
    }

    @Override
    public String getDescription() {
        return "Detects driver fake GPS movement, unrealistic speed, excessive delays, and assignment manipulation";
    }

    @Override
    public List<RuleResult> evaluate(FraudContext context) {
        List<RuleResult> results = new ArrayList<>();

        double maxSpeed = thresholdService.getMaxDriverSpeedKmh();
        int maxDelay = thresholdService.getMaxDeliveryDelayMinutes();
        int maxRejections = thresholdService.getMaxDriverRejections();

        List<DriverLocationHistory> recentLocations = context.getRecentLocations();
        List<DeliveryAssignment> recentAssignments = context.getRecentAssignments();

        // Build driverId -> userId map lazily from only drivers appearing in locations/assignments
        Set<Long> driverIds = new HashSet<>();
        if (recentLocations != null) {
            for (DriverLocationHistory loc : recentLocations) {
                if (loc.getDriverId() != null) {
                    driverIds.add(loc.getDriverId());
                }
            }
        }
        if (recentAssignments != null) {
            for (DeliveryAssignment da : recentAssignments) {
                if (da.getDriverId() != null) {
                    driverIds.add(da.getDriverId());
                }
            }
        }

        Map<Long, Long> driverToUserMap = Collections.emptyMap();
        if (!driverIds.isEmpty()) {
            List<DeliveryPartner> activeDrivers = driverRepo.findAllById(driverIds);
            driverToUserMap = activeDrivers.stream()
                    .collect(Collectors.toMap(DeliveryPartner::getId, DeliveryPartner::getUserId, (a, b) -> a));
        }

        // 1. Fake GPS / Unrealistic Speed
        Map<Long, List<DriverLocationHistory>> locationsByDriver = recentLocations == null ? Collections.emptyMap() :
                recentLocations.stream()
                        .collect(Collectors.groupingBy(DriverLocationHistory::getDriverId));

        final Map<Long, Long> finalDriverToUserMap = driverToUserMap;

        locationsByDriver.forEach((driverId, logs) -> {
            Long userId = finalDriverToUserMap.get(driverId);
            if (userId == null) return;
            
            // Sort logs to ensure we trace chronologically if they are not already sorted
            logs.sort(Comparator.comparing(DriverLocationHistory::getRecordedAt));

            for (int i = 0; i < logs.size() - 1; i++) {
                DriverLocationHistory p1 = logs.get(i);
                DriverLocationHistory p2 = logs.get(i + 1);

                double distance = HaversineUtil.km(p1.getLat(), p1.getLng(), p2.getLat(), p2.getLng());
                long seconds = Duration.between(p1.getRecordedAt(), p2.getRecordedAt()).toSeconds();

                // Skip extremely close timestamps to prevent division by zero or GPS noise
                if (seconds > 5) {
                    double hours = seconds / 3600.0;
                    double speed = distance / hours;

                    if (speed > maxSpeed) {
                        results.add(RuleResult.builder()
                                .flagged(true)
                                .userId(userId)
                                .orderId(p2.getOrderId())
                                .flagType("DRIVER_FAKE_GPS")
                                .riskScore(85)
                                .details(Map.of(
                                        "driverId", driverId,
                                        "speedKmh", speed,
                                        "maxAllowedSpeedKmh", maxSpeed,
                                        "distanceKm", distance,
                                        "durationSeconds", seconds,
                                        "point1", Map.of("lat", p1.getLat(), "lng", p1.getLng(), "time", p1.getRecordedAt()),
                                        "point2", Map.of("lat", p2.getLat(), "lng", p2.getLng(), "time", p2.getRecordedAt())
                                ))
                                .build());
                        break; // Flag once per scan
                    }
                }
            }
        });

        // 2. Excessive delivery delays
        if (recentAssignments != null) {
            for (DeliveryAssignment da : recentAssignments) {
                if (da.getPickedUpAt() != null && da.getDeliveredAt() != null) {
                    long actualMin = Duration.between(da.getPickedUpAt(), da.getDeliveredAt()).toMinutes();
                    int estimatedMin = da.getEstimatedDurationMin() != null ? da.getEstimatedDurationMin() : 30;

                    if (actualMin > estimatedMin + maxDelay) {
                        Long userId = finalDriverToUserMap.get(da.getDriverId());
                        if (userId != null) {
                            results.add(RuleResult.builder()
                                    .flagged(true)
                                    .userId(userId)
                                    .orderId(da.getOrderId())
                                    .flagType("DRIVER_EXCESSIVE_DELIVERY_DELAY")
                                    .riskScore(70)
                                    .details(Map.of(
                                            "driverId", da.getDriverId(),
                                            "actualDurationMinutes", actualMin,
                                            "estimatedDurationMinutes", estimatedMin,
                                            "delayMinutes", (actualMin - estimatedMin)
                                    ))
                                    .build());
                        }
                    }
                }
            }
        }

        // 3. Delivery manipulation (excessive rejections / cancellations)
        if (recentAssignments != null) {
            Map<Long, List<DeliveryAssignment>> assignmentsByDriver = recentAssignments.stream()
                    .collect(Collectors.groupingBy(DeliveryAssignment::getDriverId));

            assignmentsByDriver.forEach((driverId, list) -> {
                List<DeliveryAssignment> rejectedOrCancelled = list.stream()
                        .filter(da -> da.getStatus() == AssignmentStatus.REJECTED || da.getStatus() == AssignmentStatus.CANCELLED)
                        .toList();

                if (rejectedOrCancelled.size() > maxRejections) {
                    Long userId = finalDriverToUserMap.get(driverId);
                    if (userId != null) {
                        results.add(RuleResult.builder()
                                .flagged(true)
                                .userId(userId)
                                .flagType("DRIVER_MANIPULATION")
                                .riskScore(75)
                                .details(Map.of(
                                        "driverId", driverId,
                                        "rejectedOrCancelledCount", rejectedOrCancelled.size(),
                                        "maxAllowedRejections", maxRejections,
                                        "assignmentIds", rejectedOrCancelled.stream().map(DeliveryAssignment::getId).toList()
                                ))
                                .build());
                    }
                }
            });
        }

        return results;
    }
}
