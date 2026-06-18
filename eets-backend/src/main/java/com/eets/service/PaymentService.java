package com.eets.service;

import com.eets.config.RazorpayConfig;
import com.eets.exception.PaymentException;
import com.eets.util.HmacUtil;
import com.razorpay.RazorpayClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final RazorpayClient client;
    private final RazorpayConfig cfg;
    private final StringRedisTemplate redis;

    public void trackFailedPayment(Long userId) {
        String key = "fraud:failed-payments:count:" + userId;
        redis.opsForValue().increment(key);
        redis.expire(key, java.time.Duration.ofHours(1));
    }

    public record RazorpayOrder(String id, BigDecimal amount, String currency) {}

    public RazorpayOrder createOrder(BigDecimal totalAmount, Long userId) {
        try {
            long paise = totalAmount.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValueExact();
            JSONObject opts = new JSONObject();
            opts.put("amount", paise);
            opts.put("currency", "INR");
            opts.put("receipt", "eets_" + userId + "_" + System.currentTimeMillis());
            com.razorpay.Order rzOrder = client.orders.create(opts);
            String id = rzOrder.get("id");
            log.info("Razorpay order created: {} for user={}", id, userId);
            return new RazorpayOrder(id, totalAmount, "INR");
        } catch (Exception e) {
            log.error("Razorpay order failed", e);
            throw new PaymentException("Failed to create payment order");
        }
    }

    public void verifySignature(String orderId, String paymentId, String signature) {
        String payload = orderId + "|" + paymentId;
        if (!HmacUtil.verify(payload, cfg.getKeySecret(), signature))
            throw new PaymentException("Signature mismatch");
        log.info("Payment verified for order {}", orderId);
    }

    public void refund(String paymentId, BigDecimal amount) {
        if (paymentId == null) { log.info("No payment id to refund (COD?)"); return; }
        try {
            // Before refunding, check status from Razorpay
            try {
                com.razorpay.Payment payment = client.payments.fetch(paymentId);
                if (payment != null) {
                    String status = payment.get("status");
                    String refundStatus = payment.get("refund_status");
                    if ("refunded".equalsIgnoreCase(status) || "full".equalsIgnoreCase(refundStatus)) {
                        log.warn("Payment {} has already been fully refunded (status={}, refundStatus={}). Skipping duplicate refund.", paymentId, status, refundStatus);
                        return;
                    }
                }
            } catch (Exception fetchEx) {
                log.warn("Failed to check refund status from Razorpay for payment {}: {}", paymentId, fetchEx.getMessage());
            }

            long paise = amount.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValueExact();
            JSONObject opts = new JSONObject();
            opts.put("amount", paise);
            client.payments.refund(paymentId, opts);
            log.info("Refund initiated: payment={} amount={}", paymentId, amount);
        } catch (Exception e) {
            String msg = e.getMessage();
            if (msg != null && (msg.toLowerCase().contains("fully refunded") || msg.toLowerCase().contains("refunded") || msg.toLowerCase().contains("refund"))) {
                log.warn("Razorpay indicates payment {} is already refunded: {}", paymentId, msg);
                return;
            }
            log.error("Refund failed for payment {}", paymentId, e);
            throw new PaymentException("Refund failed");
        }
    }

    public String getKeyId() { return cfg.getKeyId(); }
}
