package com.eets.fraud.rule.impl;

import com.eets.domain.Order;
import com.eets.domain.PaymentStatus;
import com.eets.domain.PaymentMethod;
import com.eets.fraud.context.FraudContext;
import com.eets.fraud.model.RuleResult;
import com.eets.fraud.rule.FraudRule;
import com.eets.repository.OrderRepository;
import com.eets.service.FraudThresholdService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentFraudRule implements FraudRule {

    private final FraudThresholdService thresholdService;
    private final StringRedisTemplate redis;

    @Override
    public String getName() {
        return "PAYMENT_FRAUD";
    }

    @Override
    public String getDescription() {
        return "Detects multiple failed payments, high-risk transactions, and suspicious payment patterns";
    }

    @Override
    public List<RuleResult> evaluate(FraudContext context) {
        List<RuleResult> results = new ArrayList<>();
        List<Order> recentOrders = context.getRecentOrders();
        if (recentOrders == null) {
            recentOrders = Collections.emptyList();
        }

        int maxFailedPayments = thresholdService.getMaxFailedPaymentsHour();
        BigDecimal highRiskLimit = thresholdService.getHighRiskTransactionAmount();

        Map<Long, List<Order>> ordersByUser = recentOrders.stream()
                .filter(o -> o.getUserId() != null)
                .collect(Collectors.groupingBy(Order::getUserId));

        ordersByUser.forEach((userId, userOrders) -> {
            // 1. Multiple failed payments in short time
            // We check the database for FAILED paymentStatus orders
            List<Order> failedOrders = userOrders.stream()
                    .filter(o -> o.getPaymentStatus() == PaymentStatus.FAILED)
                    .toList();

            // We also check Redis for transient failures
            String redisKey = "fraud:failed-payments:count:" + userId;
            String redisVal = redis.opsForValue().get(redisKey);
            int redisFailedCount = redisVal != null ? Integer.parseInt(redisVal) : 0;

            int totalFailedCount = Math.max(failedOrders.size(), redisFailedCount);

            if (totalFailedCount > maxFailedPayments) {
                results.add(RuleResult.builder()
                        .flagged(true)
                        .userId(userId)
                        .flagType("SUSPICIOUS_FAILED_PAYMENTS")
                        .riskScore(75)
                        .details(Map.of(
                                "failedPaymentsCount", totalFailedCount,
                                "failedOrdersInDb", failedOrders.stream().map(Order::getId).toList(),
                                "maxAllowedFailedPayments", maxFailedPayments
                        ))
                        .build());
            }

            // 2. High-risk transactions
            for (Order o : userOrders) {
                if (o.getTotalAmount() != null && o.getTotalAmount().compareTo(highRiskLimit) > 0) {
                    results.add(RuleResult.builder()
                            .flagged(true)
                            .userId(userId)
                            .orderId(o.getId())
                            .flagType("HIGH_RISK_TRANSACTION")
                            .riskScore(70)
                            .details(Map.of(
                                    "amount", o.getTotalAmount(),
                                    "limit", highRiskLimit,
                                    "orderId", o.getId()
                            ))
                            .build());
                }
            }

            // 3. Suspicious payment patterns (e.g. rapid method changes)
            userOrders.sort(Comparator.comparing(Order::getCreatedAt));
            if (userOrders.size() >= 3) {
                for (int i = 0; i < userOrders.size() - 2; i++) {
                    Order o1 = userOrders.get(i);
                    Order o3 = userOrders.get(i + 2);

                    if (Duration.between(o1.getCreatedAt(), o3.getCreatedAt()).toMinutes() <= 30) {
                        Set<PaymentMethod> uniqueMethods = new HashSet<>();
                        uniqueMethods.add(o1.getPaymentMethod());
                        uniqueMethods.add(userOrders.get(i + 1).getPaymentMethod());
                        uniqueMethods.add(o3.getPaymentMethod());

                        if (uniqueMethods.size() >= 3) {
                            results.add(RuleResult.builder()
                                    .flagged(true)
                                    .userId(userId)
                                    .orderId(o3.getId())
                                    .flagType("SUSPICIOUS_PAYMENT_PATTERN")
                                    .riskScore(80)
                                    .details(Map.of(
                                            "uniqueMethodsUsed", uniqueMethods,
                                            "timeWindowMinutes", 30,
                                            "orderIds", List.of(o1.getId(), userOrders.get(i + 1).getId(), o3.getId())
                                    ))
                                    .build());
                            break; // Flag once per scan
                        }
                    }
                }
            }
        });

        return results;
    }
}
