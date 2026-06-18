package com.eets.config;

import com.twilio.Twilio;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
@Getter
public class TwilioConfig {

    @Value("${twilio.account-sid:}")
    private String accountSid;

    @Value("${twilio.auth-token:}")
    private String authToken;

    @Value("${twilio.verify-service-sid:}")
    private String verifyServiceSid;

    @PostConstruct
    public void init() {
        if (enabled()) {
            Twilio.init(accountSid, authToken);
            log.info("Twilio initialised. Verify Service SID configured: {}", !verifyServiceSid.isBlank());
        } else {
            log.warn("Twilio is not configured — OTPs will be logged to console (dev mode).");
        }
    }

    public boolean enabled() {
        return accountSid != null && !accountSid.isBlank()
            && authToken != null && !authToken.isBlank();
    }

    public boolean verifyEnabled() {
        return enabled()
            && verifyServiceSid != null && !verifyServiceSid.isBlank();
    }
}