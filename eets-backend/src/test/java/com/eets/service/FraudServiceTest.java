package com.eets.service;

import com.eets.domain.*;
import com.eets.fraud.context.FraudContext;
import com.eets.fraud.model.RuleResult;
import com.eets.fraud.rule.FraudRule;
import com.eets.repository.*;
import com.eets.websocket.AdminSocketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FraudServiceTest {

    @Mock private FraudFlagRepository flags;
    @Mock private UserRepository users;
    @Mock private FraudAuditLogRepository auditLogs;
    @Mock private NotificationService notificationService;
    @Mock private AdminSocketService adminSocket;
    @Mock private OrderRepository orderRepository;
    @Mock private CouponUsageRepository couponUsageRepository;
    @Mock private DriverLocationHistoryRepository driverLocationHistoryRepository;
    @Mock private DeliveryAssignmentRepository deliveryAssignmentRepository;

    @Mock private FraudRule mockRule;

    private FraudService fraudService;

    @BeforeEach
    void setUp() {
        // We inject the rule list containing our mock rule
        List<FraudRule> ruleList = Collections.singletonList(mockRule);
        fraudService = new FraudService(flags, users, auditLogs, ruleList, notificationService, adminSocket,
                orderRepository, couponUsageRepository, driverLocationHistoryRepository, deliveryAssignmentRepository);
    }

    @Test
    @DisplayName("runDetection - runs rules, saves open flags and recalculates scores")
    void testRunDetection_SavesFlagsAndRecalculates() {
        RuleResult result = RuleResult.builder()
                .flagged(true)
                .userId(100L)
                .flagType("EXCESSIVE_ORDERS_SHORT_TIME")
                .riskScore(80)
                .details(Map.of("count", 5))
                .build();

        when(mockRule.getName()).thenReturn("MOCK_RULE");
        when(mockRule.evaluate(any(FraudContext.class))).thenReturn(Collections.singletonList(result));
        when(flags.existsByUserIdAndFlagTypeAndStatus(100L, "EXCESSIVE_ORDERS_SHORT_TIME", FraudStatus.OPEN)).thenReturn(false);

        User user = User.builder().id(100L).name("Abin").email("abin@example.com").fraudRiskScore(FraudRiskScore.LOW).build();
        when(users.findById(100L)).thenReturn(Optional.of(user));
        when(flags.findByUserIdAndStatus(100L, FraudStatus.OPEN)).thenReturn(
                Collections.singletonList(FraudFlag.builder().userId(100L).riskScore(80).status(FraudStatus.OPEN).build())
        );

        // Set up search for admin users (role search when risk score goes high)
        User admin = User.builder().id(1L).email("admin@eets.com").role(Role.ADMIN).build();
        when(users.search(null, Role.ADMIN, PageRequest.of(0, 50))).thenReturn(new PageImpl<>(Collections.singletonList(admin)));
        when(users.search(null, Role.SUPER_ADMIN, PageRequest.of(0, 50))).thenReturn(new PageImpl<>(Collections.emptyList()));

        fraudService.runDetection();

        verify(flags).save(any(FraudFlag.class));
        verify(users).save(user);
        assertThat(user.getFraudRiskScore()).isEqualTo(FraudRiskScore.HIGH);
        verify(adminSocket).broadcastFraudAlert(any());
        verify(notificationService).send(eq(1L), anyString(), anyString(), eq("FRAUD_ALERT"), eq(100L));
    }

    @Test
    @DisplayName("recalculateUserRiskScore - sets score to LOW when no open flags are present")
    void testRecalculateUserRiskScore_Low() {
        User user = User.builder().id(100L).name("Abin").fraudRiskScore(FraudRiskScore.HIGH).build();
        when(users.findById(100L)).thenReturn(Optional.of(user));
        when(flags.findByUserIdAndStatus(100L, FraudStatus.OPEN)).thenReturn(Collections.emptyList());

        fraudService.recalculateUserRiskScore(100L);

        assertThat(user.getFraudRiskScore()).isEqualTo(FraudRiskScore.LOW);
        verify(users).save(user);
    }
}
