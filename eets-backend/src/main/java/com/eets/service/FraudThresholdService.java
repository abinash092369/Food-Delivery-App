package com.eets.service;

import com.eets.config.FraudThresholdProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FraudThresholdService {

    private final StringRedisTemplate redisTemplate;
    private final FraudThresholdProperties props;

    private static final String REDIS_PREFIX = "fraud:thresholds:";

    public String getValue(String name, String defaultValue) {
        try {
            String val = redisTemplate.opsForValue().get(REDIS_PREFIX + name);
            return val != null ? val : defaultValue;
        } catch (Exception e) {
            log.error("Failed to read threshold {} from Redis, fallback to default", name, e);
            return defaultValue;
        }
    }

    public void setValue(String name, String value) {
        try {
            redisTemplate.opsForValue().set(REDIS_PREFIX + name, value);
            log.info("Updated fraud threshold dynamic override: {}={}", name, value);
        } catch (Exception e) {
            log.error("Failed to write threshold {} to Redis", name, e);
        }
    }

    public void clearOverride(String name) {
        try {
            redisTemplate.delete(REDIS_PREFIX + name);
        } catch (Exception e) {
            log.error("Failed to clear threshold override {}", name, e);
        }
    }

    public int getMaxOrdersShortTime() {
        return Integer.parseInt(getValue("maxOrdersShortTime", String.valueOf(props.getMaxOrdersShortTime())));
    }

    public int getShortTimeMinutes() {
        return Integer.parseInt(getValue("shortTimeMinutes", String.valueOf(props.getShortTimeMinutes())));
    }

    public int getMaxAccountsPerCoupon() {
        return Integer.parseInt(getValue("maxAccountsPerCoupon", String.valueOf(props.getMaxAccountsPerCoupon())));
    }

    public int getMaxCouponCancellations() {
        return Integer.parseInt(getValue("maxCouponCancellations", String.valueOf(props.getMaxCouponCancellations())));
    }

    public double getMaxDriverSpeedKmh() {
        return Double.parseDouble(getValue("maxDriverSpeedKmh", String.valueOf(props.getMaxDriverSpeedKmh())));
    }

    public int getMaxDeliveryDelayMinutes() {
        return Integer.parseInt(getValue("maxDeliveryDelayMinutes", String.valueOf(props.getMaxDeliveryDelayMinutes())));
    }

    public int getMaxDriverRejections() {
        return Integer.parseInt(getValue("maxDriverRejections", String.valueOf(props.getMaxDriverRejections())));
    }

    public int getMaxFailedPaymentsHour() {
        return Integer.parseInt(getValue("maxFailedPaymentsHour", String.valueOf(props.getMaxFailedPaymentsHour())));
    }

    public BigDecimal getHighRiskTransactionAmount() {
        return new BigDecimal(getValue("highRiskTransactionAmount", props.getHighRiskTransactionAmount().toString()));
    }

    public Map<String, Object> getAllThresholds() {
        Map<String, Object> map = new HashMap<>();
        map.put("maxOrdersShortTime", getMaxOrdersShortTime());
        map.put("shortTimeMinutes", getShortTimeMinutes());
        map.put("maxAccountsPerCoupon", getMaxAccountsPerCoupon());
        map.put("maxCouponCancellations", getMaxCouponCancellations());
        map.put("maxDriverSpeedKmh", getMaxDriverSpeedKmh());
        map.put("maxDeliveryDelayMinutes", getMaxDeliveryDelayMinutes());
        map.put("maxDriverRejections", getMaxDriverRejections());
        map.put("maxFailedPaymentsHour", getMaxFailedPaymentsHour());
        map.put("highRiskTransactionAmount", getHighRiskTransactionAmount());
        return map;
    }
}
