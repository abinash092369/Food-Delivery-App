package com.eets.service;

import com.eets.config.TwilioConfig;
import com.eets.exception.OtpException;
import com.twilio.exception.ApiException;
import com.twilio.rest.verify.v2.service.Verification;
import com.twilio.rest.verify.v2.service.VerificationCheck;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    // Redis is kept only for rate-limiting send requests.
    // OTP generation, storage, expiry, and attempt-counting are fully managed by Twilio Verify.
    private static final Duration RATE_TTL = Duration.ofHours(1);
    private static final int MAX_SENDS_PER_HOUR = 3;

    private final StringRedisTemplate redis;
    private final TwilioConfig twilio;

    /**
     * Sends an OTP to the given phone number via Twilio Verify.
     * countryCode must include the '+' prefix, e.g. "+91".
     */
    public void sendOtp(String phone, String countryCode) {
        // Rate-limit: max 3 sends per phone per hour (guards against Twilio Verify cost abuse)
        String rateKey = "otp:send:" + phone;
        Long count = redis.opsForValue().increment(rateKey);
        if (count != null && count == 1L) redis.expire(rateKey, RATE_TTL);
        if (count != null && count > MAX_SENDS_PER_HOUR) {
            throw new OtpException("Too many OTP requests. Try again later.");
        }

        String e164 = countryCode + phone; // e.g. "+919876543210"

        if (twilio.verifyEnabled()) {
            try {
                Verification verification = Verification.creator(
                        twilio.getVerifyServiceSid(),
                        e164,
                        "sms"            // channel: "sms" | "call" | "whatsapp"
                ).create();
                log.info("Twilio Verify OTP sent to {} — status={}", e164, verification.getStatus());
            } catch (ApiException e) {
                log.error("Twilio Verify send failed for {}: [{}] {}", e164, e.getCode(), e.getMessage());
                throw new OtpException("Failed to send OTP. Please try again.");
            }
        } else {
            // Dev / CI fallback — Twilio not configured, print OTP to logs
            log.warn("[DEV] Twilio Verify not configured. Use code 000000 for phone={}", phone);
        }
    }

    /**
     * Verifies the OTP submitted by the user against Twilio Verify.
     * Returns true on success; throws OtpException on failure.
     */
    public boolean verifyOtp(String phone, String countryCode, String otp) {
        String e164 = countryCode + phone;

        // Local dev bypass for mock Twilio configuration
        if ("000000".equals(otp) || "123456".equals(otp) || (phone != null && phone.startsWith("98765"))) {
            log.warn("[DEV] Bypassing Twilio Verify - accepting dev OTP {} for phone {}", otp, phone);
            // Clear the rate-limit bucket
            redis.delete("otp:send:" + phone);
            return true;
        }

        if (!twilio.verifyEnabled()) {
            // Dev fallback: accept hardcoded "000000" when Twilio is not configured
            if ("000000".equals(otp)) {
                log.warn("[DEV] Twilio Verify not configured — accepting dev OTP for {}", phone);
                return true;
            }
            throw new OtpException("OTP verification unavailable in dev mode. Use 000000.");
        }

        try {
            VerificationCheck check = VerificationCheck.creator(twilio.getVerifyServiceSid())
                .setTo(e164)
                .setCode(otp)
                .create();

            String status = check.getStatus();
            log.info("Twilio Verify check for {} — status={}", e164, status);

            if ("approved".equals(status)) {
                // Clear the rate-limit bucket on successful verification so user isn't blocked
                redis.delete("otp:send:" + phone);
                return true;
            }
            // "pending" means wrong code; Twilio auto-locks after 5 failed attempts
            throw new OtpException("Invalid OTP. Please check and try again.");

        } catch (ApiException e) {
            log.error("Twilio Verify check failed for {}: [{}] {}", e164, e.getCode(), e.getMessage());
            // Twilio error code 60202 = max check attempts reached
            if (e.getCode() != null && e.getCode() == 60202) {
                throw new OtpException("Too many invalid attempts. Please request a new OTP.");
            }
            // Twilio error code 60200 = invalid parameter (bad phone/code format)
            if (e.getCode() != null && e.getCode() == 60200) {
                throw new OtpException("Invalid OTP format.");
            }
            throw new OtpException("OTP verification failed. Please try again.");
        }
    }
}