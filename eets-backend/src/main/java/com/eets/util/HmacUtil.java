package com.eets.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

public final class HmacUtil {
    private HmacUtil() {}

    public static String hmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("HMAC failure", e);
        }
    }

    public static boolean verify(String data, String secret, String expectedSignature) {
        String actual = hmacSha256(data, secret);
        return constantTimeEquals(actual, expectedSignature == null ? "" : expectedSignature);
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a.length() != b.length()) return false;
        int r = 0;
        for (int i = 0; i < a.length(); i++) r |= a.charAt(i) ^ b.charAt(i);
        return r == 0;
    }
}
