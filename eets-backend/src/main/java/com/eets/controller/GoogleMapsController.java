package com.eets.controller;

import com.eets.domain.DeliveryPartner;
import com.eets.domain.User;
import com.eets.dto.response.DriverProfileResponse;
import com.eets.service.DriverService;
import com.eets.service.GoogleMapsService;
import com.eets.repository.DeliveryPartnerRepository;
import com.eets.repository.UserRepository;
import com.eets.repository.DeliveryAssignmentRepository;
import com.eets.domain.AssignmentStatus;
import com.eets.util.ApiResponse;
import com.eets.util.HaversineUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.geo.GeoResults;
import org.springframework.data.geo.GeoResult;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.domain.geo.GeoReference;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/maps")
@RequiredArgsConstructor
@Tag(name = "Google Maps & Routing", description = "Endpoints for Google Maps routing, distance matrix, and nearby driver search")
public class GoogleMapsController {

    private final GoogleMapsService googleMapsService;
    private final StringRedisTemplate redis;
    private final DeliveryPartnerRepository drivers;
    private final UserRepository users;
    private final DriverService driverService;
    private final DeliveryAssignmentRepository assignments;

    @Value("${eets.delivery.default-driver-operating-radius-km:10.0}")
    private double defaultDriverOperatingRadiusKm;

    @Value("${eets.delivery.max-nearby-drivers:10}")
    private int maxNearbyDrivers;

    @Operation(summary = "Search for nearby online drivers", description = "Searches for online and verified drivers within a specific radius using Redis GEO, ranking them using the driver assignment scoring algorithm")
    @GetMapping("/nearby-drivers")
    public ApiResponse<List<Map<String, Object>>> getNearbyDrivers(
            @Parameter(description = "Latitude of search center point (e.g. restaurant)", required = true) @RequestParam double lat,
            @Parameter(description = "Longitude of search center point", required = true) @RequestParam double lng,
            @Parameter(description = "Initial search radius in kilometers") @RequestParam(required = false) Double radiusKm
    ) {
        double searchRadius = radiusKm != null ? radiusKm : 5.0;
        List<Double> searchRadii = List.of(2.0, 5.0, 10.0, 15.0, 20.0);
        
        List<DeliveryPartner> available = new ArrayList<>();
        Map<Long, Double> driverDistanceMap = new HashMap<>();

        // Concentric progressive search simulation
        for (double currentRadiusKm : searchRadii) {
            available.clear();
            driverDistanceMap.clear();
            try {
                org.springframework.data.geo.Distance radiusDist = new org.springframework.data.geo.Distance(currentRadiusKm, org.springframework.data.redis.connection.RedisGeoCommands.DistanceUnit.KILOMETERS);
                GeoResults<RedisGeoCommands.GeoLocation<String>> results = redis.opsForGeo().search(
                        "drivers:locations",
                        GeoReference.fromCoordinate(lng, lat),
                        radiusDist,
                        RedisGeoCommands.GeoSearchCommandArgs.newGeoSearchArgs().includeDistance().sortAscending()
                );

                if (results != null) {
                    List<Long> driverIds = new ArrayList<>();
                    for (GeoResult<RedisGeoCommands.GeoLocation<String>> res : results.getContent()) {
                        Long dId = Long.valueOf(res.getContent().getName());
                        driverIds.add(dId);
                        driverDistanceMap.put(dId, res.getDistance().getValue());
                    }
                    if (!driverIds.isEmpty()) {
                        List<DeliveryPartner> dbDrivers = drivers.findAllById(driverIds);
                        for (DeliveryPartner d : dbDrivers) {
                            if (Boolean.TRUE.equals(d.getIsOnline()) && Boolean.TRUE.equals(d.getIsVerified())) {
                                double dist = driverDistanceMap.getOrDefault(d.getId(), HaversineUtil.km(lat, lng, d.getCurrentLat(), d.getCurrentLng()));
                                double opRadius = d.getOperatingRadiusKm() != null ? d.getOperatingRadiusKm() : defaultDriverOperatingRadiusKm;
                                if (dist <= opRadius) {
                                    available.add(d);
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                // Fallback to database query
                double radiusMeters = currentRadiusKm * 1000;
                List<DeliveryPartner> dbDrivers = drivers.findAvailableDriversNearby(lat, lng, radiusMeters);
                for (DeliveryPartner d : dbDrivers) {
                    if (d.getCurrentLat() != null && d.getCurrentLng() != null) {
                        double dist = HaversineUtil.km(lat, lng, d.getCurrentLat(), d.getCurrentLng());
                        double opRadius = d.getOperatingRadiusKm() != null ? d.getOperatingRadiusKm() : defaultDriverOperatingRadiusKm;
                        if (dist <= opRadius) {
                            available.add(d);
                            driverDistanceMap.put(d.getId(), dist);
                        }
                    }
                }
            }

            if (!available.isEmpty()) {
                break;
            }
        }

        // Limit candidates and apply scoring
        available.sort(Comparator.comparingDouble(d -> driverDistanceMap.getOrDefault(d.getId(), 0.0)));
        List<DeliveryPartner> topNDrivers = available.stream().limit(maxNearbyDrivers).toList();

        List<Long> userIds = topNDrivers.stream().map(DeliveryPartner::getUserId).toList();
        Map<Long, User> userMap = users.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        List<Map<String, Object>> scoredDrivers = new ArrayList<>();
        for (DeliveryPartner d : topNDrivers) {
            double dist = driverDistanceMap.getOrDefault(d.getId(), HaversineUtil.km(lat, lng, d.getCurrentLat(), d.getCurrentLng()));
            long workload = assignments.countByDriverIdAndStatus(d.getId(), AssignmentStatus.ACCEPTED)
                + assignments.countByDriverIdAndStatus(d.getId(), AssignmentStatus.PICKED_UP);

            double rating = d.getAvgRating() != null ? d.getAvgRating() : 0.0;
            double acceptanceRate = d.getAcceptanceRate() != null ? d.getAcceptanceRate() : 1.0;
            double completionRate = d.getCompletionRate() != null ? d.getCompletionRate() : 1.0;

            double score = (rating * 10.0)
                         - (dist * 5.0)
                         + (acceptanceRate * 20.0)
                         + (completionRate * 20.0)
                         - (workload * 15.0);

            User user = userMap.get(d.getUserId());
            if (user != null) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("driverId", d.getId());
                map.put("name", user.getName());
                map.put("phone", user.getPhone());
                map.put("distanceKm", dist);
                map.put("workload", workload);
                map.put("rating", rating);
                map.put("score", score);
                map.put("acceptanceRate", acceptanceRate);
                map.put("completionRate", completionRate);
                scoredDrivers.add(map);
            }
        }

        // Sort response by score descending
        scoredDrivers.sort((m1, m2) -> Double.compare((Double) m2.get("score"), (Double) m1.get("score")));

        return ApiResponse.ok(scoredDrivers);
    }

    @Operation(summary = "Calculate distance and duration", description = "Calculates driving distance and duration between two coordinates using Google Distance Matrix API")
    @GetMapping("/distance")
    public ApiResponse<GoogleMapsService.RouteInfo> getDistance(
            @RequestParam double originLat, @RequestParam double originLng,
            @RequestParam double destLat, @RequestParam double destLng
    ) {
        GoogleMapsService.RouteInfo routeInfo = googleMapsService.getDistanceAndDuration(originLat, originLng, destLat, destLng);
        return ApiResponse.ok(routeInfo);
    }

    @Operation(summary = "Generate optimized route", description = "Generates the optimized route and polyline from driver to restaurant to customer using Google Directions API")
    @GetMapping("/route")
    public ApiResponse<GoogleMapsService.RouteInfo> getRoute(
            @RequestParam double driverLat, @RequestParam double driverLng,
            @RequestParam double restaurantLat, @RequestParam double restaurantLng,
            @RequestParam double customerLat, @RequestParam double customerLng
    ) {
        GoogleMapsService.RouteInfo routeInfo = googleMapsService.getOptimizedRoute(
                driverLat, driverLng,
                restaurantLat, restaurantLng,
                customerLat, customerLng
        );
        return ApiResponse.ok(routeInfo);
    }
}
