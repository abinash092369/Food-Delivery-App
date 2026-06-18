package com.eets.service;

import com.eets.domain.*;
import com.eets.repository.*;
import com.eets.fraud.context.FraudContext;
import com.eets.fraud.model.RuleResult;
import com.eets.fraud.rule.FraudRule;
import com.eets.websocket.AdminSocketService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class FraudService {

    private final FraudFlagRepository flags;
    private final UserRepository users;
    private final FraudAuditLogRepository auditLogs;
    private final List<FraudRule> rules;
    private final NotificationService notificationService;
    private final AdminSocketService adminSocket;
    private final OrderRepository orderRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final DriverLocationHistoryRepository driverLocationHistoryRepository;
    private final DeliveryAssignmentRepository deliveryAssignmentRepository;
    private final ObjectMapper json = new ObjectMapper();

    public void runDetection() {
        log.info("Running enterprise fraud detection sweep using rule engine");
        Instant scanStart = Instant.now();
        Instant checkWindow = scanStart.minus(java.time.Duration.ofHours(24));

        List<Order> recentOrders = orderRepository.findByCreatedAtAfter(checkWindow);
        List<CouponUsage> recentUsages = couponUsageRepository.findByCreatedAtAfter(checkWindow);
        List<DriverLocationHistory> recentLocations = driverLocationHistoryRepository.findByRecordedAtAfterOrderByRecordedAtAsc(checkWindow);
        List<DeliveryAssignment> recentAssignments = deliveryAssignmentRepository.findByCreatedAtAfter(checkWindow);

        FraudContext context = FraudContext.builder()
                .scanStartTime(scanStart)
                .checkWindowStart(checkWindow)
                .recentOrders(recentOrders)
                .recentCouponUsages(recentUsages)
                .recentLocations(recentLocations)
                .recentAssignments(recentAssignments)
                .build();

        List<RuleResult> ruleResults = new ArrayList<>();
        for (FraudRule rule : rules) {
            try {
                log.info("Evaluating fraud rule: {}", rule.getName());
                List<RuleResult> results = rule.evaluate(context);
                if (results != null) {
                    ruleResults.addAll(results);
                }
            } catch (Exception e) {
                log.error("Error evaluating fraud rule {}", rule.getName(), e);
            }
        }

        int newFlagsCount = 0;
        Set<Long> usersToReevaluate = new HashSet<>();
        Set<String> processedFlags = new HashSet<>();

        for (RuleResult res : ruleResults) {
            if (res.isFlagged() && res.getUserId() != null) {
                String flagKey = res.getUserId() + ":" + res.getFlagType();
                if (processedFlags.contains(flagKey)) {
                    continue;
                }
                boolean exists = flags.existsByUserIdAndFlagTypeAndStatus(
                        res.getUserId(), res.getFlagType(), FraudStatus.OPEN);
                if (!exists) {
                    try {
                        String detailsStr = json.writeValueAsString(res.getDetails());
                        FraudFlag flag = FraudFlag.builder()
                                .userId(res.getUserId())
                                .orderId(res.getOrderId())
                                .flagType(res.getFlagType())
                                .riskScore(res.getRiskScore())
                                .details(detailsStr)
                                .status(FraudStatus.OPEN)
                                .flaggedAt(Instant.now())
                                .build();
                        flags.save(flag);
                        processedFlags.add(flagKey);
                        newFlagsCount++;
                        usersToReevaluate.add(res.getUserId());
                        log.warn("Raised fraud flag: user={} type={} score={}", res.getUserId(), res.getFlagType(), res.getRiskScore());
                    } catch (Exception e) {
                        log.error("Failed to save fraud flag for user={}", res.getUserId(), e);
                    }
                }
            }
        }

        // Re-evaluate risk scores for users flagged in this run
        for (Long userId : usersToReevaluate) {
            recalculateUserRiskScore(userId);
        }

        // Log scan run to audit logs
        try {
            auditLogs.save(FraudAuditLog.builder()
                    .action("FRAUD_SCAN_RUN")
                    .performedBy("SYSTEM")
                    .details("Scan completed. New flags raised: " + newFlagsCount + ". Evaluated " + rules.size() + " rules.")
                    .build());
        } catch (Exception e) {
            log.error("Failed to save fraud scan audit log", e);
        }
    }

    public void runRealTimeCheck(Long userId, Order order) {
        log.info("Running real-time fraud check for user={} order={}", userId, order.getId());
        Instant scanStart = Instant.now();
        Instant checkWindow = scanStart.minus(java.time.Duration.ofHours(24));

        List<Order> recentOrders = orderRepository.findByCreatedAtAfter(checkWindow);
        boolean containsCurrent = recentOrders.stream().anyMatch(o -> o.getId().equals(order.getId()));
        if (!containsCurrent) {
            recentOrders = new ArrayList<>(recentOrders);
            recentOrders.add(order);
        }

        List<CouponUsage> recentUsages = couponUsageRepository.findByCreatedAtAfter(checkWindow);
        List<DriverLocationHistory> recentLocations = driverLocationHistoryRepository.findByRecordedAtAfterOrderByRecordedAtAsc(checkWindow);
        List<DeliveryAssignment> recentAssignments = deliveryAssignmentRepository.findByCreatedAtAfter(checkWindow);

        FraudContext context = FraudContext.builder()
                .scanStartTime(scanStart)
                .checkWindowStart(checkWindow)
                .recentOrders(recentOrders)
                .recentCouponUsages(recentUsages)
                .recentLocations(recentLocations)
                .recentAssignments(recentAssignments)
                .build();

        List<RuleResult> ruleResults = new ArrayList<>();
        for (FraudRule rule : rules) {
            try {
                List<RuleResult> results = rule.evaluate(context);
                if (results != null) {
                    ruleResults.addAll(results);
                }
            } catch (Exception e) {
                log.error("Error evaluating fraud rule {} in real-time", rule.getName(), e);
            }
        }

        Set<String> processedFlags = new HashSet<>();
        for (RuleResult res : ruleResults) {
            if (res.isFlagged() && res.getUserId() != null && res.getUserId().equals(userId)) {
                String flagKey = res.getUserId() + ":" + res.getFlagType();
                if (processedFlags.contains(flagKey)) {
                    continue;
                }
                boolean exists = flags.existsByUserIdAndFlagTypeAndStatus(
                        res.getUserId(), res.getFlagType(), FraudStatus.OPEN);
                if (!exists) {
                    try {
                        String detailsStr = json.writeValueAsString(res.getDetails());
                        FraudFlag flag = FraudFlag.builder()
                                .userId(res.getUserId())
                                .orderId(res.getOrderId() != null ? res.getOrderId() : order.getId())
                                .flagType(res.getFlagType())
                                .riskScore(res.getRiskScore())
                                .details(detailsStr)
                                .status(FraudStatus.OPEN)
                                .flaggedAt(Instant.now())
                                .build();
                        flags.save(flag);
                        processedFlags.add(flagKey);
                        log.warn("Raised real-time fraud flag: user={} type={} score={}", res.getUserId(), res.getFlagType(), res.getRiskScore());
                    } catch (Exception e) {
                        log.error("Failed to save real-time fraud flag for user={}", res.getUserId(), e);
                    }
                }
            }
        }

        // Recalculate risk score immediately
        recalculateUserRiskScore(userId);

        // Fetch user and check if they are banned or have CRITICAL risk
        User user = users.findById(userId).orElse(null);
        if (user != null) {
            if (Boolean.TRUE.equals(user.getIsBanned()) || user.getFraudRiskScore() == FraudRiskScore.CRITICAL) {
                if (!Boolean.TRUE.equals(user.getIsBanned())) {
                    user.setIsBanned(true);
                    user.setIsActive(false);
                    user.setBanReason("Automated real-time fraud block: CRITICAL risk score");
                    users.save(user);

                    auditLogs.save(FraudAuditLog.builder()
                            .action("USER_BLOCKED")
                            .performedBy("SYSTEM")
                            .targetType("USER")
                            .targetId(userId)
                            .details("Automated block due to real-time critical fraud detection")
                            .build());
                }
                throw new com.eets.exception.UnauthorizedException("Order blocked: Suspicious fraud activity detected.");
            }
        }
    }

    public void recalculateUserRiskScore(Long userId) {
        User user = users.findById(userId).orElse(null);
        if (user == null) return;

        List<FraudFlag> openFlags = flags.findByUserIdAndStatus(userId, FraudStatus.OPEN);
        FraudRiskScore newScore = FraudRiskScore.LOW;

        if (!openFlags.isEmpty()) {
            int maxScore = openFlags.stream()
                    .mapToInt(FraudFlag::getRiskScore)
                    .max()
                    .orElse(0);

            if (maxScore >= 85) {
                newScore = FraudRiskScore.CRITICAL;
            } else if (maxScore >= 75) {
                newScore = FraudRiskScore.HIGH;
            } else if (maxScore >= 50) {
                newScore = FraudRiskScore.MEDIUM;
            }
        }

        FraudRiskScore oldScore = user.getFraudRiskScore();
        if (oldScore != newScore) {
            user.setFraudRiskScore(newScore);
            users.save(user);

            // Audit log
            auditLogs.save(FraudAuditLog.builder()
                    .action("RISK_SCORE_CHANGED")
                    .performedBy("SYSTEM")
                    .targetType("USER")
                    .targetId(userId)
                    .details("Risk score updated from " + oldScore + " to " + newScore)
                    .build());

            // Alert admins on high/critical score
            if (newScore == FraudRiskScore.HIGH || newScore == FraudRiskScore.CRITICAL) {
                String alertTitle = "CRITICAL Fraud Alert: User " + user.getName();
                String alertBody = "User ID " + userId + " risk score changed to " + newScore + " due to " + openFlags.size() + " open flags.";

                // Real-time WebSocket update to Admins
                try {
                    adminSocket.broadcastFraudAlert(Map.of(
                            "event", "fraud_risk_alert",
                            "userId", userId,
                            "userName", user.getName(),
                            "riskScore", newScore.name(),
                            "openFlagsCount", openFlags.size()
                    ));
                } catch (Exception e) {
                    log.error("Failed to broadcast WebSocket fraud alert", e);
                }

                // In-App / FCM Notifications to Admins
                try {
                    // Fetch admins to send direct alerts
                    users.search(null, Role.ADMIN, PageRequest.of(0, 50)).getContent().forEach(admin -> {
                        notificationService.send(admin.getId(), alertTitle, alertBody, "FRAUD_ALERT", userId);
                    });
                    users.search(null, Role.SUPER_ADMIN, PageRequest.of(0, 50)).getContent().forEach(admin -> {
                        notificationService.send(admin.getId(), alertTitle, alertBody, "FRAUD_ALERT", userId);
                    });
                } catch (Exception e) {
                    log.error("Failed to notify admins of fraud alert", e);
                }
            }
        }
    }
}
