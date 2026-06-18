package com.eets.security;

import com.eets.domain.Role;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}") private String secret;
    @Value("${jwt.access-token-expiry}") private long accessExpiry;
    @Value("${jwt.refresh-token-expiry}") private long refreshExpiry;

    private SecretKey key;

    @PostConstruct
    void init() {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(bytes, 0, padded, 0, bytes.length);
            bytes = padded;
        }
        this.key = Keys.hmacShaKeyFor(bytes);
    }

    public String generateAccessToken(Long userId, String email, Role role, Long restaurantId, Long driverId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("uid", userId);
        claims.put("email", email);
        claims.put("role", role.name());
        if (restaurantId != null) claims.put("rid", restaurantId);
        if (driverId != null) claims.put("did", driverId);
        return Jwts.builder()
            .claims(claims)
            .subject(String.valueOf(userId))
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + accessExpiry))
            .signWith(key)
            .compact();
    }

    public String generateRefreshToken(Long userId) {
        return Jwts.builder()
            .subject(String.valueOf(userId))
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + refreshExpiry))
            .signWith(key)
            .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }

    public boolean validate(String token) {
        try { parse(token); return true; } catch (JwtException | IllegalArgumentException e) { return false; }
    }

    public Long extractUserId(String token) { return Long.valueOf(parse(token).getSubject()); }
    public String extractRole(String token) { return (String) parse(token).get("role"); }

    public long getRefreshExpiry() { return refreshExpiry; }
}
