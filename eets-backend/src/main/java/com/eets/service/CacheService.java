package com.eets.service;

import com.eets.config.CacheConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class CacheService {

    private final CacheManager cacheManager;

    public void evictRestaurant(String slug) {
        if (slug == null) return;
        log.info("Evicting restaurant details cache for slug: {}", slug);
        var detailsCache = cacheManager.getCache(CacheConstants.RESTAURANT_DETAILS);
        if (detailsCache != null) {
            detailsCache.evict(slug);
        }
        
        // Evict lists and search results that could contain stale data
        evictAllRestaurantLists();
    }

    public void evictAllRestaurantLists() {
        log.info("Evicting all restaurant lists, search results, and nearby restaurants caches");
        var listCache = cacheManager.getCache(CacheConstants.RESTAURANT_LIST);
        if (listCache != null) {
            listCache.clear();
        }
        var searchCache = cacheManager.getCache(CacheConstants.SEARCH_RESULTS);
        if (searchCache != null) {
            searchCache.clear();
        }
        var nearbyCache = cacheManager.getCache(CacheConstants.NEARBY_RESTAURANTS);
        if (nearbyCache != null) {
            nearbyCache.clear();
        }
    }

    public void evictMenu(Long restaurantId) {
        if (restaurantId == null) return;
        log.info("Evicting menu cache for restaurant ID: {}", restaurantId);
        var menuCache = cacheManager.getCache(CacheConstants.MENU_DETAILS);
        if (menuCache != null) {
            menuCache.evict(restaurantId);
        }
        
        // Evict search results since menu items might have changed
        var searchCache = cacheManager.getCache(CacheConstants.SEARCH_RESULTS);
        if (searchCache != null) {
            searchCache.clear();
        }
    }

    public void evictAnalytics() {
        log.info("Evicting analytics caches");
        var metricsCache = cacheManager.getCache(CacheConstants.ANALYTICS_METRICS);
        if (metricsCache != null) {
            metricsCache.clear();
        }
        var revenueCache = cacheManager.getCache(CacheConstants.REVENUE_SUMMARIES);
        if (revenueCache != null) {
            revenueCache.clear();
        }
        var orderStatsCache = cacheManager.getCache(CacheConstants.ORDER_STATISTICS);
        if (orderStatsCache != null) {
            orderStatsCache.clear();
        }
    }
    
    public void clearAllCaches() {
        log.info("Clearing all caches");
        cacheManager.getCacheNames().forEach(name -> {
            var cache = cacheManager.getCache(name);
            if (cache != null) {
                cache.clear();
            }
        });
    }
}
