package com.eets.health;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.stereotype.Component;

@Component("customRedis")
public class CustomRedisHealthIndicator implements HealthIndicator {

    private final RedisConnectionFactory connectionFactory;

    public CustomRedisHealthIndicator(RedisConnectionFactory connectionFactory) {
        this.connectionFactory = connectionFactory;
    }

    @Override
    public Health health() {
        try (RedisConnection conn = connectionFactory.getConnection()) {
            String ping = conn.ping();
            if ("PONG".equalsIgnoreCase(ping)) {
                return Health.up().withDetail("redis", "Available").build();
            }
            return Health.down().withDetail("redis", "Ping failed: " + ping).build();
        } catch (Exception e) {
            return Health.down(e).withDetail("redis", "Unavailable").build();
        }
    }
}
