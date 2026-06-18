package com.eets.controller;

import com.eets.service.CacheService;
import com.eets.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@Tag(name = "Cache Monitoring", description = "Endpoints for cache eviction and Redis diagnostics")
@RestController
@RequestMapping("/api/admin/caches")
@RequiredArgsConstructor
public class CacheMonitoringController {

    private final CacheService cacheService;
    private final CacheManager cacheManager;
    private final StringRedisTemplate redisTemplate;

    @Operation(summary = "Get current cache registry configurations and Redis server stats")
    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("cacheNames", cacheManager.getCacheNames());
        
        try {
            var connFactory = redisTemplate.getConnectionFactory();
            if (connFactory != null) {
                Properties info = connFactory.getConnection().serverCommands().info();
                if (info != null) {
                    stats.put("status", "UP");
                    stats.put("redisVersion", info.getProperty("redis_version"));
                    stats.put("connectedClients", info.getProperty("connected_clients"));
                    stats.put("usedMemoryHuman", info.getProperty("used_memory_human"));
                    stats.put("usedMemoryPeakHuman", info.getProperty("used_memory_peak_human"));
                    stats.put("uptimeInSeconds", info.getProperty("uptime_in_seconds"));
                } else {
                    stats.put("status", "UP");
                    stats.put("details", "Redis connection is working, but info statistics are unavailable.");
                }
            } else {
                stats.put("status", "DOWN");
                stats.put("error", "No connection factory configured.");
            }
        } catch (Exception e) {
            stats.put("status", "DOWN");
            stats.put("error", e.getMessage());
        }
        
        return ApiResponse.ok(stats);
    }

    @Operation(summary = "Clear all active caches")
    @PostMapping("/clear")
    public ApiResponse<Map<String, Object>> clearAll() {
        cacheService.clearAllCaches();
        return ApiResponse.ok(Map.of("message", "All caches cleared successfully"));
    }

    @Operation(summary = "Clear a specific cache by name")
    @PostMapping("/clear/{cacheName}")
    public ApiResponse<Map<String, Object>> clearCache(@PathVariable String cacheName) {
        var cache = cacheManager.getCache(cacheName);
        if (cache == null) {
            return ApiResponse.ok(Map.of("message", "Cache '" + cacheName + "' not found or inactive"));
        }
        cache.clear();
        return ApiResponse.ok(Map.of("message", "Cache '" + cacheName + "' cleared successfully"));
    }
}
