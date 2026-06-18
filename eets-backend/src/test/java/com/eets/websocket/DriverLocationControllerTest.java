package com.eets.websocket;

import com.eets.domain.DeliveryPartner;
import com.eets.repository.DeliveryPartnerRepository;
import com.eets.repository.DriverLocationHistoryRepository;
import com.eets.service.EtaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.GeoOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.security.Principal;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DriverLocationControllerTest {

    @Mock private DeliveryPartnerRepository driverRepo;
    @Mock private OrderSocketService orderSocket;
    @Mock private StringRedisTemplate redis;
    @Mock private EtaService etaService;
    @Mock private ValueOperations<String, String> valueOps;
    @Mock private DriverLocationHistoryRepository historyRepo;
    @Mock private GeoOperations<String, String> geoOps;

    @InjectMocks
    private DriverLocationController controller;

    private DeliveryPartner driver;
    private Principal principal;

    @BeforeEach
    void setUp() {
        driver = new DeliveryPartner();
        driver.setId(10L);
        driver.setUserId(100L);

        principal = new UsernamePasswordAuthenticationToken(100L, null);
    }

    @Test
    @DisplayName("onLocation - happy path, updates driver location and broadcasts ETA")
    void onLocation_happyPath() {
        when(redis.opsForValue()).thenReturn(valueOps);
        when(redis.opsForGeo()).thenReturn(geoOps);
        Map<String, Object> body = new HashMap<>();
        body.put("driverId", 10L);
        body.put("lat", 12.9);
        body.put("lng", 77.6);
        body.put("orderId", 200L);

        when(driverRepo.findByUserId(100L)).thenReturn(Optional.of(driver));
        when(driverRepo.findById(10L)).thenReturn(Optional.of(driver));
        when(valueOps.setIfAbsent(anyString(), anyString(), any(Duration.class))).thenReturn(true);
        when(etaService.recalculateAndBroadcast(200L, 12.9, 77.6)).thenReturn(15);

        controller.onLocation(body, principal);

        verify(driverRepo).save(driver);
        verify(etaService).recalculateAndBroadcast(200L, 12.9, 77.6);
        verify(orderSocket).notifyDriverLocation(200L, 12.9, 77.6, 15);
    }

    @Test
    @DisplayName("onLocation - throws exception when unauthenticated")
    void onLocation_unauthenticated() {
        Map<String, Object> body = new HashMap<>();
        assertThatThrownBy(() -> controller.onLocation(body, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unauthenticated connection");
    }

    @Test
    @DisplayName("onLocation - throws exception on driver ID mismatch")
    void onLocation_driverIdMismatch() {
        Map<String, Object> body = new HashMap<>();
        body.put("driverId", 999L);
        body.put("lat", 12.9);
        body.put("lng", 77.6);

        when(driverRepo.findByUserId(100L)).thenReturn(Optional.of(driver));

        assertThatThrownBy(() -> controller.onLocation(body, principal))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Driver ID mismatch");
    }
}
