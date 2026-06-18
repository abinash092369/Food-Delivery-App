package com.eets.config;

import com.eets.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.data.redis.connection.RedisConnectionFactory;

@Component
@RequiredArgsConstructor
@Slf4j
public class DbCountsLogger implements CommandLineRunner {

    private final UserRepository users;
    private final RestaurantRepository restaurants;
    private final MenuCategoryRepository menuCategories;
    private final MenuItemRepository menuItems;
    private final OrderRepository orders;
    private final DeliveryPartnerRepository deliveryPartners;
    private final DeliveryAssignmentRepository assignments;
    private final RedisConnectionFactory redisConnectionFactory;

    @Override
    public void run(String... args) throws Exception {
        log.info("[DB_COUNTS_ON_STARTUP]");
        log.info("users={}", users.count());
        log.info("restaurants={}", restaurants.count());
        log.info("menuCategories={}", menuCategories.count());
        log.info("menuItems={}", menuItems.count());
        log.info("orders={}", orders.count());
        log.info("deliveryPartners={}", deliveryPartners.count());
        log.info("assignments={}", assignments.count());

        log.info("Performing Redis cache cleanup on startup...");
        try {
            redisConnectionFactory.getConnection().serverCommands().flushAll();
            log.info("Redis cache reset: FLUSHALL completed successfully on startup.");
        } catch (Exception e) {
            log.warn("Redis FLUSHALL on startup failed: {}", e.getMessage());
        }
    }
}
