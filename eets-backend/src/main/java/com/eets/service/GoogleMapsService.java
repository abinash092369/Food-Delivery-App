package com.eets.service;

import com.eets.dto.response.GoogleMapsDtos.*;
import com.eets.util.HaversineUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.github.resilience4j.retry.annotation.Retry;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.Serializable;
import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.function.Supplier;

@Slf4j
@Service
public class GoogleMapsService {

    private final RestTemplate restTemplate;
    private final String apiKey;
    private final String distanceMatrixUrl;
    private final String directionsUrl;
    private final double averageSpeedKmh;
    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;
    private final MeterRegistry meterRegistry;
    private final int cacheTtlMinutes;

    public GoogleMapsService(
            @Qualifier("googleMapsRestTemplate") RestTemplate restTemplate,
            @Value("${google.maps.api-key}") String apiKey,
            @Value("${google.maps.distance-matrix-url}") String distanceMatrixUrl,
            @Value("${google.maps.directions-url}") String directionsUrl,
            @Value("${eets.delivery.average-speed-kmh:30}") double averageSpeedKmh,
            StringRedisTemplate redis,
            ObjectMapper objectMapper,
            MeterRegistry meterRegistry,
            @Value("${google.maps.cache-ttl-minutes:1440}") int cacheTtlMinutes
    ) {
        this.restTemplate = restTemplate;
        this.apiKey = apiKey;
        this.distanceMatrixUrl = distanceMatrixUrl;
        this.directionsUrl = directionsUrl;
        this.averageSpeedKmh = averageSpeedKmh;
        this.redis = redis;
        this.objectMapper = objectMapper;
        this.meterRegistry = meterRegistry;
        this.cacheTtlMinutes = cacheTtlMinutes;
    }

    public record RouteInfo(double distanceKm, int durationSeconds, String polyline) implements Serializable {}

    /**
     * Calculates distance and duration between two points using Distance Matrix API.
     * Caches response and integrates Resilience4j circuit breaking/retries.
     */
    @CircuitBreaker(name = "googleMaps", fallbackMethod = "getDistanceAndDurationFallback")
    @Retry(name = "googleMaps")
    @RateLimiter(name = "googleMaps")
    public RouteInfo getDistanceAndDuration(double originLat, double originLng, double destLat, double destLng) {
        String cacheKey = String.format("maps:cache:distance:%.4f,%.4f:%.4f,%.4f", originLat, originLng, destLat, destLng);
        
        // Try reading from cache
        try {
            String cached = redis.opsForValue().get(cacheKey);
            if (cached != null) {
                meterRegistry.counter("google.maps.cache.hits", "api", "distancematrix").increment();
                log.debug("Distance cache hit for key {}", cacheKey);
                return objectMapper.readValue(cached, RouteInfo.class);
            }
        } catch (Exception e) {
            log.warn("Failed to read from Redis cache for distance: {}", e.getMessage());
        }

        meterRegistry.counter("google.maps.cache.misses", "api", "distancematrix").increment();

        if (isMockKey()) {
            log.info("Google Maps API key is mock/placeholder. Using Haversine fallback.");
            RouteInfo fallback = calculateHaversineFallback(originLat, originLng, destLat, destLng);
            cacheRouteInfo(cacheKey, fallback);
            return fallback;
        }

        String url = UriComponentsBuilder.fromHttpUrl(distanceMatrixUrl)
                .queryParam("origins", originLat + "," + originLng)
                .queryParam("destinations", destLat + "," + destLng)
                .queryParam("key", apiKey)
                .toUriString();

        Timer.Sample sample = Timer.start(meterRegistry);
        try {
            DistanceMatrixResponse response = restTemplate.getForObject(url, DistanceMatrixResponse.class);
            sample.stop(meterRegistry.timer("google.maps.api.latency", "api", "distancematrix"));

            if (response != null && "OK".equals(response.status()) && !response.rows().isEmpty()) {
                Row row = response.rows().get(0);
                if (row.elements() != null && !row.elements().isEmpty()) {
                    Element element = row.elements().get(0);
                    if ("OK".equals(element.status())) {
                        double distanceKm = element.distance().value() / 1000.0;
                        int durationSec = (int) element.duration().value();
                        RouteInfo routeInfo = new RouteInfo(distanceKm, durationSec, "mock_polyline");
                        
                        meterRegistry.counter("google.maps.api.calls", "api", "distancematrix", "status", "success").increment();
                        cacheRouteInfo(cacheKey, routeInfo);
                        return routeInfo;
                    }
                }
            }
            throw new RuntimeException("Distance Matrix API returned non-OK status or structure");
        } catch (Exception e) {
            meterRegistry.counter("google.maps.api.calls", "api", "distancematrix", "status", "error").increment();
            throw e;
        }
    }

    public RouteInfo getDistanceAndDurationFallback(double originLat, double originLng, double destLat, double destLng, Throwable t) {
        log.warn("Google Maps Distance Matrix circuit breaker/retry fallback triggered due to: {}", t.getMessage());
        meterRegistry.counter("google.maps.api.calls", "api", "distancematrix", "status", "fallback").increment();
        return calculateHaversineFallback(originLat, originLng, destLat, destLng);
    }

    /**
     * Generates optimized route from driver -> restaurant -> customer using Directions API.
     */
    @CircuitBreaker(name = "googleMaps", fallbackMethod = "getOptimizedRouteFallback")
    @Retry(name = "googleMaps")
    @RateLimiter(name = "googleMaps")
    public RouteInfo getOptimizedRoute(double driverLat, double driverLng, double restaurantLat, double restaurantLng, double customerLat, double customerLng) {
        String cacheKey = String.format("maps:cache:directions:%.4f,%.4f:%.4f,%.4f:%.4f,%.4f", 
                driverLat, driverLng, restaurantLat, restaurantLng, customerLat, customerLng);

        try {
            String cached = redis.opsForValue().get(cacheKey);
            if (cached != null) {
                meterRegistry.counter("google.maps.cache.hits", "api", "directions_optimized").increment();
                log.debug("Directions optimized cache hit for key {}", cacheKey);
                return objectMapper.readValue(cached, RouteInfo.class);
            }
        } catch (Exception e) {
            log.warn("Failed to read from Redis cache for directions: {}", e.getMessage());
        }

        meterRegistry.counter("google.maps.cache.misses", "api", "directions_optimized").increment();

        if (isMockKey()) {
            log.info("Google Maps API key is mock/placeholder. Using Directions fallback.");
            RouteInfo fallback = calculateDirectionsFallback(driverLat, driverLng, restaurantLat, restaurantLng, customerLat, customerLng);
            cacheRouteInfo(cacheKey, fallback);
            return fallback;
        }

        String url = UriComponentsBuilder.fromHttpUrl(directionsUrl)
                .queryParam("origin", driverLat + "," + driverLng)
                .queryParam("destination", customerLat + "," + customerLng)
                .queryParam("waypoints", restaurantLat + "," + restaurantLng)
                .queryParam("key", apiKey)
                .toUriString();

        Timer.Sample sample = Timer.start(meterRegistry);
        try {
            DirectionsResponse response = restTemplate.getForObject(url, DirectionsResponse.class);
            sample.stop(meterRegistry.timer("google.maps.api.latency", "api", "directions_optimized"));

            if (response != null && "OK".equals(response.status()) && !response.routes().isEmpty()) {
                Route route = response.routes().get(0);
                long totalDistanceMeters = 0;
                long totalDurationSeconds = 0;
                for (Leg leg : route.legs()) {
                    if (leg.distance() != null) totalDistanceMeters += leg.distance().value();
                    if (leg.duration() != null) totalDurationSeconds += leg.duration().value();
                }
                String polyline = route.overviewPolyline() != null ? route.overviewPolyline().points() : "mock_polyline";
                double distanceKm = totalDistanceMeters / 1000.0;
                RouteInfo routeInfo = new RouteInfo(distanceKm, (int) totalDurationSeconds, polyline);

                meterRegistry.counter("google.maps.api.calls", "api", "directions_optimized", "status", "success").increment();
                cacheRouteInfo(cacheKey, routeInfo);
                return routeInfo;
            }
            throw new RuntimeException("Directions API returned non-OK status: " + (response != null ? response.status() : "null"));
        } catch (Exception e) {
            meterRegistry.counter("google.maps.api.calls", "api", "directions_optimized", "status", "error").increment();
            throw e;
        }
    }

    public RouteInfo getOptimizedRouteFallback(double driverLat, double driverLng, double restaurantLat, double restaurantLng, double customerLat, double customerLng, Throwable t) {
        log.warn("Google Maps Directions optimized circuit breaker/retry fallback triggered due to: {}", t.getMessage());
        meterRegistry.counter("google.maps.api.calls", "api", "directions_optimized", "status", "fallback").increment();
        return calculateDirectionsFallback(driverLat, driverLng, restaurantLat, restaurantLng, customerLat, customerLng);
    }

    /**
     * Generates direct route from driver -> customer using Directions API.
     */
    @CircuitBreaker(name = "googleMaps", fallbackMethod = "getDirectRouteFallback")
    @Retry(name = "googleMaps")
    @RateLimiter(name = "googleMaps")
    public RouteInfo getDirectRoute(double driverLat, double driverLng, double customerLat, double customerLng) {
        String cacheKey = String.format("maps:cache:directions:%.4f,%.4f:%.4f,%.4f", driverLat, driverLng, customerLat, customerLng);

        try {
            String cached = redis.opsForValue().get(cacheKey);
            if (cached != null) {
                meterRegistry.counter("google.maps.cache.hits", "api", "directions_direct").increment();
                log.debug("Directions direct cache hit for key {}", cacheKey);
                return objectMapper.readValue(cached, RouteInfo.class);
            }
        } catch (Exception e) {
            log.warn("Failed to read from Redis cache for direct directions: {}", e.getMessage());
        }

        meterRegistry.counter("google.maps.cache.misses", "api", "directions_direct").increment();

        if (isMockKey()) {
            log.info("Google Maps API key is mock/placeholder. Using Direct Directions fallback.");
            RouteInfo fallback = calculateHaversineFallback(driverLat, driverLng, customerLat, customerLng);
            cacheRouteInfo(cacheKey, fallback);
            return fallback;
        }

        String url = UriComponentsBuilder.fromHttpUrl(directionsUrl)
                .queryParam("origin", driverLat + "," + driverLng)
                .queryParam("destination", customerLat + "," + customerLng)
                .queryParam("key", apiKey)
                .toUriString();

        Timer.Sample sample = Timer.start(meterRegistry);
        try {
            DirectionsResponse response = restTemplate.getForObject(url, DirectionsResponse.class);
            sample.stop(meterRegistry.timer("google.maps.api.latency", "api", "directions_direct"));

            if (response != null && "OK".equals(response.status()) && !response.routes().isEmpty()) {
                Route route = response.routes().get(0);
                long totalDistanceMeters = 0;
                long totalDurationSeconds = 0;
                for (Leg leg : route.legs()) {
                    if (leg.distance() != null) totalDistanceMeters += leg.distance().value();
                    if (leg.duration() != null) totalDurationSeconds += leg.duration().value();
                }
                String polyline = route.overviewPolyline() != null ? route.overviewPolyline().points() : "mock_polyline";
                double distanceKm = totalDistanceMeters / 1000.0;
                RouteInfo routeInfo = new RouteInfo(distanceKm, (int) totalDurationSeconds, polyline);

                meterRegistry.counter("google.maps.api.calls", "api", "directions_direct", "status", "success").increment();
                cacheRouteInfo(cacheKey, routeInfo);
                return routeInfo;
            }
            throw new RuntimeException("Directions API returned non-OK status: " + (response != null ? response.status() : "null"));
        } catch (Exception e) {
            meterRegistry.counter("google.maps.api.calls", "api", "directions_direct", "status", "error").increment();
            throw e;
        }
    }

    public RouteInfo getDirectRouteFallback(double driverLat, double driverLng, double customerLat, double customerLng, Throwable t) {
        log.warn("Google Maps Directions direct circuit breaker/retry fallback triggered due to: {}", t.getMessage());
        meterRegistry.counter("google.maps.api.calls", "api", "directions_direct", "status", "fallback").increment();
        return calculateHaversineFallback(driverLat, driverLng, customerLat, customerLng);
    }

    private void cacheRouteInfo(String key, RouteInfo info) {
        try {
            redis.opsForValue().set(key, objectMapper.writeValueAsString(info), Duration.ofMinutes(cacheTtlMinutes));
        } catch (Exception e) {
            log.warn("Failed to write to Redis cache: {}", e.getMessage());
        }
    }

    private boolean isMockKey() {
        return apiKey == null || apiKey.isBlank() || "mock-api-key".equalsIgnoreCase(apiKey)
                || apiKey.toLowerCase().contains("mock") || apiKey.toLowerCase().contains("placeholder");
    }

    private RouteInfo calculateHaversineFallback(double originLat, double originLng, double destLat, double destLng) {
        double distKm = HaversineUtil.km(originLat, originLng, destLat, destLng);
        int durationSec = (int) Math.round((distKm / averageSpeedKmh) * 3600.0);
        return new RouteInfo(distKm, durationSec, "mock_polyline");
    }

    private RouteInfo calculateDirectionsFallback(double driverLat, double driverLng, double restaurantLat, double restaurantLng, double customerLat, double customerLng) {
        double leg1Km = HaversineUtil.km(driverLat, driverLng, restaurantLat, restaurantLng);
        double leg2Km = HaversineUtil.km(restaurantLat, restaurantLng, customerLat, customerLng);
        double totalKm = leg1Km + leg2Km;
        int durationSec = (int) Math.round((totalKm / averageSpeedKmh) * 3600.0);
        return new RouteInfo(totalKm, durationSec, "mock_polyline");
    }
}
