package com.eets.fraud.rule.impl;

import com.eets.domain.*;
import com.eets.fraud.context.FraudContext;
import com.eets.fraud.model.RuleResult;
import com.eets.fraud.rule.FraudRule;
import com.eets.repository.AddressRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class MultiAccountAddressRule implements FraudRule {

    private final AddressRepository addressRepo;

    @Override
    public String getName() {
        return "MULTI_ACCOUNT_SAME_ADDRESS";
    }

    @Override
    public String getDescription() {
        return "Detects multiple user accounts sharing the same physical delivery address";
    }

    @Override
    public List<RuleResult> evaluate(FraudContext context) {
        List<RuleResult> results = new ArrayList<>();
        List<Order> recentOrders = context.getRecentOrders();

        if (recentOrders == null || recentOrders.isEmpty()) {
            return results;
        }

        List<Order> ordersWithAddress = recentOrders.stream()
                .filter(o -> o.getDeliveryAddressId() != null && o.getUserId() != null)
                .toList();

        if (ordersWithAddress.isEmpty()) {
            return results;
        }

        Set<Long> addressIds = ordersWithAddress.stream()
                .map(Order::getDeliveryAddressId)
                .collect(Collectors.toSet());

        Map<Long, Address> addressMap = addressRepo.findAllById(addressIds).stream()
                .collect(Collectors.toMap(Address::getId, a -> a));

        // Group orders by normalized address string
        Map<String, List<Order>> ordersByAddressStr = new HashMap<>();
        for (Order o : ordersWithAddress) {
            Address a = addressMap.get(o.getDeliveryAddressId());
            if (a != null) {
                String key = (a.getAddressLine() + "|" + a.getCity() + "|" + a.getPincode()).toLowerCase().trim();
                ordersByAddressStr.computeIfAbsent(key, k -> new ArrayList<>()).add(o);
            }
        }

        // Check if more than 2 distinct user accounts share the same physical address in the window
        int maxAccountsPerAddress = 2; // threshold

        ordersByAddressStr.forEach((addressStr, addrOrders) -> {
            Set<Long> userIds = addrOrders.stream().map(Order::getUserId).collect(Collectors.toSet());
            if (userIds.size() > maxAccountsPerAddress) {
                for (Long uid : userIds) {
                    results.add(RuleResult.builder()
                            .flagged(true)
                            .userId(uid)
                            .flagType("MULTIPLE_ACCOUNTS_SAME_ADDRESS")
                            .riskScore(75)
                            .details(Map.of(
                                    "addressKey", addressStr,
                                    "sharingUsersCount", userIds.size(),
                                    "sharingUserIds", userIds,
                                    "orderIds", addrOrders.stream().map(Order::getId).toList()
                            ))
                            .build());
                }
            }
        });

        return results;
    }
}
