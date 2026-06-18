package com.eets.config;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;

@Configuration
@Getter
public class RazorpayConfig {
    @Value("${razorpay.key-id:}") private String keyId;
    @Value("${razorpay.key-secret:}") private String keySecret;

    @Bean
    public RazorpayClient razorpayClient() throws RazorpayException {
        if (keyId == null || keyId.isBlank()) {
            // Return a dummy client; calls will fail at runtime if used unconfigured.
            return new RazorpayClient("rzp_test_dummy", "dummy_secret");
        }
        return new RazorpayClient(keyId, keySecret);
    }
}
