package com.eets.service;

import com.eets.domain.*;
import com.eets.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PayoutService {

    @Value("${eets.commission.vendor-rate}") private BigDecimal vendorRate;

    private final OrderRepository orders;
    private final PayoutRepository payouts;
    private final RestaurantRepository restaurants;
    private final DeliveryAssignmentRepository assignments;
    private final DeliveryPartnerRepository drivers;

    public void runWeeklyPayouts() {
        log.info("Running weekly payouts");
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(7);
        Instant fromInstant = start.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant toInstant = end.atStartOfDay(ZoneOffset.UTC).toInstant();

        // Vendor payouts
        List<Order> paid = orders.findAll().stream()
            .filter(o -> o.getPaymentStatus() == PaymentStatus.PAID && o.getCreatedAt() != null
                && o.getCreatedAt().isAfter(fromInstant) && o.getCreatedAt().isBefore(toInstant)).toList();
        Map<Long, List<Order>> byRestaurant = paid.stream().collect(Collectors.groupingBy(Order::getRestaurantId));
        byRestaurant.forEach((rid, list) -> {
            BigDecimal gross = list.stream().map(Order::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal commission = gross.multiply(vendorRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal net = gross.subtract(commission);
            restaurants.findById(rid).ifPresent(r ->
                payouts.save(Payout.builder().recipientId(r.getOwnerId()).type(PayoutType.VENDOR)
                    .periodStart(start).periodEnd(end).totalOrders(list.size())
                    .grossAmount(gross).commissionRate(vendorRate).commissionAmount(commission)
                    .netAmount(net).status(PayoutStatus.PENDING).build()));
        });

        // Driver payouts
        Map<Long, List<DeliveryAssignment>> byDriver = assignments.findAll().stream()
            .filter(a -> a.getStatus() == AssignmentStatus.DELIVERED && a.getDeliveredAt() != null
                && a.getDeliveredAt().isAfter(fromInstant) && a.getDeliveredAt().isBefore(toInstant))
            .collect(Collectors.groupingBy(DeliveryAssignment::getDriverId));
        byDriver.forEach((did, list) -> {
            BigDecimal gross = list.stream().filter(a -> a.getEarningsAmount() != null)
                .map(DeliveryAssignment::getEarningsAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            drivers.findById(did).ifPresent(d ->
                payouts.save(Payout.builder().recipientId(d.getUserId()).type(PayoutType.DRIVER)
                    .periodStart(start).periodEnd(end).totalOrders(list.size())
                    .grossAmount(gross).commissionRate(BigDecimal.ZERO).commissionAmount(BigDecimal.ZERO)
                    .netAmount(gross).status(PayoutStatus.PENDING).build()));
        });
    }
}
