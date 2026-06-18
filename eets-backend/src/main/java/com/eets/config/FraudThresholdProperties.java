package com.eets.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

@Configuration
@ConfigurationProperties(prefix = "eets.fraud.thresholds")
@Getter @Setter
public class FraudThresholdProperties {
    private int maxOrdersShortTime = 5;
    private int shortTimeMinutes = 10;
    private int maxAccountsPerCoupon = 3;
    private int maxCouponCancellations = 3;
    private double maxDriverSpeedKmh = 120.0;
    private int maxDeliveryDelayMinutes = 45;
    private int maxDriverRejections = 5;
    private int maxFailedPaymentsHour = 3;
    private BigDecimal highRiskTransactionAmount = new BigDecimal("10000.00");
}
