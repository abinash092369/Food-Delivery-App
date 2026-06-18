package com.eets.fraud.rule.impl;

import com.eets.domain.*;
import com.eets.fraud.context.FraudContext;
import com.eets.fraud.model.RuleResult;
import com.eets.fraud.rule.FraudRule;
import com.eets.repository.AddressRepository;
import com.eets.repository.CouponUsageRepository;
import com.eets.repository.OrderRepository;
import com.eets.service.FraudThresholdService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class CouponFraudRule implements FraudRule {

    private final AddressRepository addressRepo;
    private final FraudThresholdService thresholdService;

    @Override
    public String getName() {
        return "COUPON_FRAUD";
    }

    @Override
    public String getDescription() {
        return "Detects multiple accounts sharing coupons, coupon usage on cancelled orders, and coupon farming";
    }

    @Override
    public List<RuleResult> evaluate(FraudContext context) {
        List<RuleResult> results = new ArrayList<>();

        int maxAccounts = thresholdService.getMaxAccountsPerCoupon();
        int maxCancellations = thresholdService.getMaxCouponCancellations();

        // 1. Multiple accounts using same coupon
        List<CouponUsage> recentUsages = context.getRecentCouponUsages();
        if (recentUsages == null) {
            recentUsages = Collections.emptyList();
        }
        Map<Long, List<CouponUsage>> usagesByCoupon = recentUsages.stream()
                .collect(Collectors.groupingBy(CouponUsage::getCouponId));

        usagesByCoupon.forEach((couponId, usages) -> {
            Set<Long> userIds = usages.stream().map(CouponUsage::getUserId).collect(Collectors.toSet());
            if (userIds.size() > maxAccounts) {
                // Flag all users who participated in sharing this coupon
                for (Long uid : userIds) {
                    results.add(RuleResult.builder()
                            .flagged(true)
                            .userId(uid)
                            .flagType("COUPON_ABUSE_MULTI_ACCOUNT")
                            .riskScore(70)
                            .details(Map.of(
                                    "couponId", couponId,
                                    "uniqueUsersCount", userIds.size(),
                                    "sharedUserIds", userIds
                             ))
                            .build());
                }
            }
        });

        // 2. Repeated coupon cancellation abuse patterns
        List<Order> recentOrders = context.getRecentOrders();
        if (recentOrders == null) {
            recentOrders = Collections.emptyList();
        }
        Map<Long, List<Order>> ordersByUser = recentOrders.stream()
                .filter(o -> o.getUserId() != null)
                .collect(Collectors.groupingBy(Order::getUserId));

        ordersByUser.forEach((userId, userOrders) -> {
            List<Order> cancelledCouponOrders = userOrders.stream()
                    .filter(o -> o.getStatus() == OrderStatus.CANCELLED && o.getCouponId() != null)
                    .toList();

            if (cancelledCouponOrders.size() > maxCancellations) {
                results.add(RuleResult.builder()
                        .flagged(true)
                        .userId(userId)
                        .flagType("COUPON_CANCELLATION_ABUSE")
                        .riskScore(75)
                        .details(Map.of(
                                "cancelledCouponOrdersCount", cancelledCouponOrders.size(),
                                "cancelledOrderIds", cancelledCouponOrders.stream().map(Order::getId).toList()
                        ))
                        .build());
            }
        });

        // 3. Coupon farming (multiple accounts using the same coupon on the same address)
        List<Order> couponOrders = recentOrders.stream()
                .filter(o -> o.getCouponId() != null && o.getDeliveryAddressId() != null)
                .toList();

        if (!couponOrders.isEmpty()) {
            Set<Long> addressIds = couponOrders.stream()
                    .map(Order::getDeliveryAddressId)
                    .collect(Collectors.toSet());

            Map<Long, Address> addressMap = addressRepo.findAllById(addressIds).stream()
                    .collect(Collectors.toMap(Address::getId, a -> a));

            // Group by CouponId and Address
            Map<Long, List<Order>> ordersByCoupon = couponOrders.stream()
                    .collect(Collectors.groupingBy(Order::getCouponId));

            ordersByCoupon.forEach((couponId, orders) -> {
                // Group these orders by their normalized address string
                Map<String, List<Order>> ordersByAddressStr = new HashMap<>();
                for (Order o : orders) {
                    Address a = addressMap.get(o.getDeliveryAddressId());
                    if (a != null) {
                        String key = (a.getAddressLine() + "|" + a.getCity() + "|" + a.getPincode()).toLowerCase().trim();
                        ordersByAddressStr.computeIfAbsent(key, k -> new ArrayList<>()).add(o);
                    }
                }

                ordersByAddressStr.forEach((addressStr, addrOrders) -> {
                    Set<Long> userIds = addrOrders.stream().map(Order::getUserId).collect(Collectors.toSet());
                    if (userIds.size() > 1) { // multiple distinct accounts using same coupon at same address
                        for (Long uid : userIds) {
                            results.add(RuleResult.builder()
                                    .flagged(true)
                                    .userId(uid)
                                    .flagType("COUPON_FARMING")
                                    .riskScore(85)
                                    .details(Map.of(
                                            "couponId", couponId,
                                            "addressKey", addressStr,
                                            "farmingUsers", userIds,
                                            "orderIds", addrOrders.stream().map(Order::getId).toList()
                                    ))
                                    .build());
                        }
                    }
                });
            });
        }

        return results;
    }
}
