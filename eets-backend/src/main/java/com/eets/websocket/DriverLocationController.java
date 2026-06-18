package com.eets.websocket;

import com.eets.repository.DeliveryPartnerRepository;
import com.eets.service.EtaService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import java.time.Duration;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class DriverLocationController {

    private final DeliveryPartnerRepository driverRepo;
    private final OrderSocketService orderSocket;
    private final StringRedisTemplate redis;
    private final EtaService etaService;
    private final com.eets.repository.DriverLocationHistoryRepository historyRepo;

    @MessageMapping("/driver/location")
    public void onLocation(Map<String, Object> body, java.security.Principal principal) {
        if (principal == null) {
            throw new IllegalArgumentException("Unauthenticated connection");
        }
        Long driverId = ((Number) body.get("driverId")).longValue();

        Long authUserId;
        if (principal instanceof org.springframework.security.authentication.UsernamePasswordAuthenticationToken authToken) {
            authUserId = (Long) authToken.getPrincipal();
        } else {
            authUserId = Long.valueOf(principal.getName());
        }

        com.eets.domain.DeliveryPartner driver = driverRepo.findByUserId(authUserId)
            .orElseThrow(() -> new IllegalArgumentException("Not a registered driver"));
        if (!driver.getId().equals(driverId)) {
            throw new IllegalArgumentException("Driver ID mismatch - access denied");
        }

        Double lat = ((Number) body.get("lat")).doubleValue();
        Double lng = ((Number) body.get("lng")).doubleValue();
        Object orderIdObj = body.get("orderId");
        Long orderId = orderIdObj == null ? null : ((Number) orderIdObj).longValue();

        // Always update Redis GEO with the latest coordinates for online/verified drivers
        redis.opsForGeo().add("drivers:locations", new org.springframework.data.geo.Point(lng, lat), String.valueOf(driverId));

        // throttle DB writes to ~ 1 per 5 seconds per driver
        String key = "driver:loc:throttle:" + driverId;
        Boolean ok = redis.opsForValue().setIfAbsent(key, "1", Duration.ofSeconds(5));
        if (Boolean.TRUE.equals(ok)) {
            driverRepo.findById(driverId).ifPresent(d -> {
                d.setCurrentLat(lat); d.setCurrentLng(lng);
                driverRepo.save(d);
            });
            // Persist to history for analytics and fraud detection
            historyRepo.save(com.eets.domain.DriverLocationHistory.builder()
                .driverId(driverId)
                .lat(lat)
                .lng(lng)
                .recordedAt(java.time.Instant.now())
                .orderId(orderId)
                .build());
        }
        if (orderId != null) {
            String etaThrottleKey = "eta:throttle:" + orderId;
            Boolean shouldRecalc = redis.opsForValue().setIfAbsent(etaThrottleKey, "1", Duration.ofSeconds(30));
            Integer etaMin = null;
            if (Boolean.TRUE.equals(shouldRecalc)) {
                etaMin = etaService.recalculateAndBroadcast(orderId, lat, lng);
            }
            if (etaMin == null) {
                etaMin = etaService.getCachedEta(orderId);
            }
            orderSocket.notifyDriverLocation(orderId, lat, lng, etaMin);
        }
    }
}
