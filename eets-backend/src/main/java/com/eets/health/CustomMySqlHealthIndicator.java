package com.eets.health;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

@Component("customMySql")
public class CustomMySqlHealthIndicator implements HealthIndicator {

    private final DataSource dataSource;

    public CustomMySqlHealthIndicator(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Health health() {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute("SELECT 1");
            return Health.up().withDetail("database", "MySQL").withDetail("status", "Available").build();
        } catch (Exception e) {
            return Health.down(e).withDetail("database", "MySQL").withDetail("status", "Unavailable").build();
        }
    }
}
