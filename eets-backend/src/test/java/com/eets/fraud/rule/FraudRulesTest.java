package com.eets.fraud.rule;

import com.eets.domain.*;
import com.eets.fraud.context.FraudContext;
import com.eets.fraud.model.RuleResult;
import com.eets.fraud.rule.impl.*;
import com.eets.repository.*;
import com.eets.service.FraudThresholdService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FraudRulesTest {

    @Mock private AddressRepository addressRepo;
    @Mock private DeliveryPartnerRepository driverRepo;
    @Mock private FraudThresholdService thresholdService;
    @Mock private StringRedisTemplate redis;
    @Mock private ValueOperations<String, String> valueOperations;

    private FraudContext context;
    private Instant now;

    @BeforeEach
    void setUp() {
        now = Instant.now();
    }

    @Test
    @DisplayName("MultipleOrderAbuseRule - flags excessive orders in short window")
    void testMultipleOrderAbuseRule_ExcessiveOrders() {
        MultipleOrderAbuseRule rule = new MultipleOrderAbuseRule(thresholdService);

        when(thresholdService.getMaxOrdersShortTime()).thenReturn(2);
        when(thresholdService.getShortTimeMinutes()).thenReturn(10);

        Order o1 = Order.builder().id(1L).userId(100L).build(); o1.setCreatedAt(now.minus(5, ChronoUnit.MINUTES));
        Order o2 = Order.builder().id(2L).userId(100L).build(); o2.setCreatedAt(now.minus(3, ChronoUnit.MINUTES));
        Order o3 = Order.builder().id(3L).userId(100L).build(); o3.setCreatedAt(now.minus(1, ChronoUnit.MINUTES));
        List<Order> orders = Arrays.asList(o1, o2, o3);

        context = FraudContext.builder()
                .scanStartTime(now)
                .checkWindowStart(now.minus(24, ChronoUnit.HOURS))
                .recentOrders(new ArrayList<>(orders))
                .build();

        List<RuleResult> results = rule.evaluate(context);
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getFlagType()).isEqualTo("EXCESSIVE_ORDERS_SHORT_TIME");
        assertThat(results.get(0).getUserId()).isEqualTo(100L);
    }

    @Test
    @DisplayName("MultipleOrderAbuseRule - flags same payment instrument used by different accounts")
    void testMultipleOrderAbuseRule_SharedPayment() {
        MultipleOrderAbuseRule rule = new MultipleOrderAbuseRule(thresholdService);

        when(thresholdService.getMaxOrdersShortTime()).thenReturn(10);
        when(thresholdService.getShortTimeMinutes()).thenReturn(10);

        Order o1 = Order.builder().id(1L).userId(100L).razorpayPaymentId("pay_shared").build(); o1.setCreatedAt(now);
        Order o2 = Order.builder().id(2L).userId(200L).razorpayPaymentId("pay_shared").build(); o2.setCreatedAt(now);
        List<Order> orders = Arrays.asList(o1, o2);

        context = FraudContext.builder()
                .scanStartTime(now)
                .checkWindowStart(now.minus(24, ChronoUnit.HOURS))
                .recentOrders(orders)
                .build();

        List<RuleResult> results = rule.evaluate(context);
        assertThat(results).hasSize(2);
        assertThat(results.get(0).getFlagType()).isEqualTo("PAYMENT_INSTRUMENT_ABUSE");
    }

    @Test
    @DisplayName("CouponFraudRule - flags multi-account coupon sharing")
    void testCouponFraudRule_MultiAccount() {
        CouponFraudRule rule = new CouponFraudRule(addressRepo, thresholdService);

        when(thresholdService.getMaxAccountsPerCoupon()).thenReturn(2);

        List<CouponUsage> usages = Arrays.asList(
                CouponUsage.builder().couponId(55L).userId(100L).build(),
                CouponUsage.builder().couponId(55L).userId(200L).build(),
                CouponUsage.builder().couponId(55L).userId(300L).build()
        );

        context = FraudContext.builder()
                .scanStartTime(now)
                .checkWindowStart(now.minus(24, ChronoUnit.HOURS))
                .recentCouponUsages(usages)
                .recentOrders(Collections.emptyList())
                .build();

        List<RuleResult> results = rule.evaluate(context);
        assertThat(results).hasSize(3);
        assertThat(results.get(0).getFlagType()).isEqualTo("COUPON_ABUSE_MULTI_ACCOUNT");
    }

    @Test
    @DisplayName("CouponFraudRule - flags coupon farming at same address")
    void testCouponFraudRule_CouponFarming() {
        CouponFraudRule rule = new CouponFraudRule(addressRepo, thresholdService);

        when(thresholdService.getMaxAccountsPerCoupon()).thenReturn(10);
        when(thresholdService.getMaxCouponCancellations()).thenReturn(10);

        Order o1 = Order.builder().id(1L).userId(100L).couponId(55L).deliveryAddressId(10L).build(); o1.setCreatedAt(now);
        Order o2 = Order.builder().id(2L).userId(200L).couponId(55L).deliveryAddressId(20L).build(); o2.setCreatedAt(now);
        List<Order> orders = Arrays.asList(o1, o2);
        Address addr1 = Address.builder().id(10L).addressLine("123 Main St").city("Bangalore").pincode("560001").build();
        Address addr2 = Address.builder().id(20L).addressLine("123 Main St").city("Bangalore").pincode("560001").build();

        when(addressRepo.findAllById(anySet())).thenReturn(Arrays.asList(addr1, addr2));

        context = FraudContext.builder()
                .scanStartTime(now)
                .checkWindowStart(now.minus(24, ChronoUnit.HOURS))
                .recentOrders(orders)
                .build();

        List<RuleResult> results = rule.evaluate(context);
        assertThat(results).hasSize(2);
        assertThat(results.get(0).getFlagType()).isEqualTo("COUPON_FARMING");
    }

    @Test
    @DisplayName("DriverFraudRule - flags drivers with unrealistic speed / Fake GPS")
    void testDriverFraudRule_FakeGps() {
        DriverFraudRule rule = new DriverFraudRule(driverRepo, thresholdService);

        when(thresholdService.getMaxDriverSpeedKmh()).thenReturn(100.0);

        DeliveryPartner driver = DeliveryPartner.builder().id(1L).userId(500L).build();
        when(driverRepo.findAllById(anySet())).thenReturn(List.of(driver));

        // Location points from Bangalore coordinates cover ~10km in 10 seconds -> ~3600 km/h
        List<DriverLocationHistory> locations = Arrays.asList(
                DriverLocationHistory.builder().driverId(1L).lat(12.9716).lng(77.5946).recordedAt(now.minusSeconds(10)).build(),
                DriverLocationHistory.builder().driverId(1L).lat(13.0500).lng(77.6500).recordedAt(now).build()
        );

        context = FraudContext.builder()
                .scanStartTime(now)
                .checkWindowStart(now.minus(24, ChronoUnit.HOURS))
                .recentLocations(locations)
                .recentAssignments(Collections.emptyList())
                .build();

        List<RuleResult> results = rule.evaluate(context);
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getFlagType()).isEqualTo("DRIVER_FAKE_GPS");
    }

    @Test
    @DisplayName("PaymentFraudRule - flags suspicious payment attempts and high risk transaction amount")
    void testPaymentFraudRule_HighRiskAndFailedPayments() {
        PaymentFraudRule rule = new PaymentFraudRule(thresholdService, redis);

        when(thresholdService.getMaxFailedPaymentsHour()).thenReturn(2);
        when(thresholdService.getHighRiskTransactionAmount()).thenReturn(new BigDecimal("5000.00"));
        when(redis.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn("3"); // simulating 3 failed payments in Redis

        Order o1 = Order.builder().id(1L).userId(100L).paymentStatus(PaymentStatus.PENDING)
                .totalAmount(new BigDecimal("6000.00")).build(); o1.setCreatedAt(now);
        List<Order> orders = List.of(o1);

        context = FraudContext.builder()
                .scanStartTime(now)
                .checkWindowStart(now.minus(24, ChronoUnit.HOURS))
                .recentOrders(orders)
                .build();

        List<RuleResult> results = rule.evaluate(context);
        // Should flag 1 for high risk transaction, and 1 for excessive failed payments
        assertThat(results).hasSize(2);
        assertThat(results.stream().map(RuleResult::getFlagType)).containsExactlyInAnyOrder("HIGH_RISK_TRANSACTION", "SUSPICIOUS_FAILED_PAYMENTS");
    }

    @Test
    @DisplayName("MultiAccountAddressRule - flags multiple accounts sharing address")
    void testMultiAccountAddressRule_SharedAddress() {
        MultiAccountAddressRule rule = new MultiAccountAddressRule(addressRepo);

        Order o1 = Order.builder().id(1L).userId(100L).deliveryAddressId(10L).build();
        Order o2 = Order.builder().id(2L).userId(200L).deliveryAddressId(20L).build();
        Order o3 = Order.builder().id(3L).userId(300L).deliveryAddressId(30L).build();
        List<Order> orders = Arrays.asList(o1, o2, o3);

        Address addr1 = Address.builder().id(10L).addressLine("123 Main St").city("Bangalore").pincode("560001").build();
        Address addr2 = Address.builder().id(20L).addressLine("123 Main St").city("Bangalore").pincode("560001").build();
        Address addr3 = Address.builder().id(30L).addressLine("123 Main St").city("Bangalore").pincode("560001").build();

        when(addressRepo.findAllById(anySet())).thenReturn(Arrays.asList(addr1, addr2, addr3));

        context = FraudContext.builder()
                .scanStartTime(now)
                .checkWindowStart(now.minus(24, ChronoUnit.HOURS))
                .recentOrders(orders)
                .build();

        List<RuleResult> results = rule.evaluate(context);
        assertThat(results).hasSize(3);
        assertThat(results.stream().map(RuleResult::getUserId)).containsExactlyInAnyOrder(100L, 200L, 300L);
        assertThat(results.get(0).getFlagType()).isEqualTo("MULTIPLE_ACCOUNTS_SAME_ADDRESS");
    }
}
