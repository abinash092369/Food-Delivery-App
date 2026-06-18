package com.eets.fraud.rule.impl;

import com.eets.domain.Order;
import com.eets.fraud.context.FraudContext;
import com.eets.fraud.model.RuleResult;
import com.eets.fraud.rule.FraudRule;
import com.eets.repository.OrderRepository;
import com.eets.service.FraudThresholdService;
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
public class MultipleOrderAbuseRule implements FraudRule {

    private final FraudThresholdService thresholdService;

    @Override
    public String getName() {
        return "MULTIPLE_ORDER_ABUSE";
    }

    @Override
    public String getDescription() {
        return "Detects excessive order placement rate and payment instrument sharing across accounts";
    }

    @Override
    public List<RuleResult> evaluate(FraudContext context) {
        List<RuleResult> results = new ArrayList<>();
        List<Order> recentOrders = context.getRecentOrders();
        if (recentOrders == null) {
            recentOrders = Collections.emptyList();
        }

        int maxOrders = thresholdService.getMaxOrdersShortTime();
        int shortMinutes = thresholdService.getShortTimeMinutes();

        // 1. Excessive orders in short time
        Map<Long, List<Order>> ordersByUser = recentOrders.stream()
                .filter(o -> o.getUserId() != null)
                .collect(Collectors.groupingBy(Order::getUserId));

        ordersByUser.forEach((userId, userOrders) -> {
            userOrders.sort(Comparator.comparing(Order::getCreatedAt));
            for (int i = 0; i < userOrders.size(); i++) {
                Instant current = userOrders.get(i).getCreatedAt();
                int count = 1;
                List<Long> matchedOrderIds = new ArrayList<>();
                matchedOrderIds.add(userOrders.get(i).getId());

                for (int j = i + 1; j < userOrders.size(); j++) {
                    Order nextOrder = userOrders.get(j);
                    if (Duration.between(current, nextOrder.getCreatedAt()).toMinutes() <= shortMinutes) {
                        count++;
                        matchedOrderIds.add(nextOrder.getId());
                    } else {
                        break;
                    }
                }

                if (count > maxOrders) {
                    results.add(RuleResult.builder()
                            .flagged(true)
                            .userId(userId)
                            .orderId(userOrders.get(i).getId())
                            .flagType("EXCESSIVE_ORDERS_SHORT_TIME")
                            .riskScore(80)
                            .details(Map.of(
                                    "orderCount", count,
                                    "timeWindowMinutes", shortMinutes,
                                    "orderIds", matchedOrderIds
                            ))
                            .build());
                    break; // Flag once per scan for this user
                }
            }
        });

        // 2. Same payment instrument abuse
        Map<String, List<Order>> ordersByPaymentId = recentOrders.stream()
                .filter(o -> o.getRazorpayPaymentId() != null && !o.getRazorpayPaymentId().isBlank())
                .collect(Collectors.groupingBy(Order::getRazorpayPaymentId));

        ordersByPaymentId.forEach((paymentId, paymentOrders) -> {
            Set<Long> userIds = paymentOrders.stream().map(Order::getUserId).collect(Collectors.toSet());
            if (userIds.size() > 1) {
                // Flag all users who shared this payment instrument
                for (Order o : paymentOrders) {
                    results.add(RuleResult.builder()
                            .flagged(true)
                            .userId(o.getUserId())
                            .orderId(o.getId())
                            .flagType("PAYMENT_INSTRUMENT_ABUSE")
                            .riskScore(90)
                            .details(Map.of(
                                    "razorpayPaymentId", paymentId,
                                    "sharedUserCount", userIds.size(),
                                    "sharedUserIds", userIds
                            ))
                            .build());
                }
            }
        });

        return results;
    }
}
