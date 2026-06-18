package com.eets.service;

import com.eets.dto.response.GoogleMapsDtos.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GoogleMapsServiceTest {

    @Mock private RestTemplate restTemplate;
    @Mock private StringRedisTemplate redis;
    @Mock private ValueOperations<String, String> valueOperations;
    private final MeterRegistry meterRegistry = new io.micrometer.core.instrument.simple.SimpleMeterRegistry();

    private ObjectMapper objectMapper = new ObjectMapper();
    private GoogleMapsService googleMapsService;

    @BeforeEach
    void setUp() {
        googleMapsService = new GoogleMapsService(
                restTemplate,
                "real-google-maps-api-key",
                "https://maps.googleapis.com/maps/api/distancematrix/json",
                "https://maps.googleapis.com/maps/api/directions/json",
                30.0,
                redis,
                objectMapper,
                meterRegistry,
                1440
        );
    }

    @Test
    @DisplayName("should use Haversine fallback when api key is mock")
    void fallbackWhenApiKeyIsMock() {
        GoogleMapsService mockService = new GoogleMapsService(
                restTemplate,
                "mock-api-key",
                "https://maps.googleapis.com/maps/api/distancematrix/json",
                "https://maps.googleapis.com/maps/api/directions/json",
                30.0,
                redis,
                objectMapper,
                meterRegistry,
                1440
        );

        when(redis.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn(null);

        double originLat = 12.9716;
        double originLng = 77.5946;
        double destLat = 12.9352;
        double destLng = 77.6245;

        GoogleMapsService.RouteInfo routeInfo = mockService.getDistanceAndDuration(originLat, originLng, destLat, destLng);

        assertThat(routeInfo.distanceKm()).isGreaterThan(0.0);
        assertThat(routeInfo.durationSeconds()).isGreaterThan(0);

        verifyNoInteractions(restTemplate);
    }

    @Test
    @DisplayName("should call Distance Matrix API and parse response correctly")
    void callDistanceMatrixApiSuccessfully() {
        double originLat = 12.9716;
        double originLng = 77.5946;
        double destLat = 12.9352;
        double destLng = 77.6245;

        when(redis.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn(null);

        Distance distance = new Distance("5.0 km", 5000);
        Duration duration = new Duration("10 mins", 600);
        Element element = new Element(distance, duration, "OK");
        Row row = new Row(Collections.singletonList(element));
        DistanceMatrixResponse mockResponse = new DistanceMatrixResponse(
                Collections.singletonList("dest"),
                Collections.singletonList("origin"),
                Collections.singletonList(row),
                "OK"
        );

        when(restTemplate.getForObject(anyString(), eq(DistanceMatrixResponse.class))).thenReturn(mockResponse);

        GoogleMapsService.RouteInfo routeInfo = googleMapsService.getDistanceAndDuration(originLat, originLng, destLat, destLng);

        assertThat(routeInfo.distanceKm()).isEqualTo(5.0);
        assertThat(routeInfo.durationSeconds()).isEqualTo(600);
    }

    @Test
    @DisplayName("should fallback to Haversine when Distance Matrix response is invalid")
    void fallbackOnInvalidDistanceMatrixResponse() {
        double originLat = 12.9716;
        double originLng = 77.5946;
        double destLat = 12.9352;
        double destLng = 77.6245;

        GoogleMapsService.RouteInfo routeInfo = googleMapsService.getDistanceAndDurationFallback(
                originLat, originLng, destLat, destLng, new RuntimeException("API error")
        );

        assertThat(routeInfo.distanceKm()).isGreaterThan(0.0);
        assertThat(routeInfo.durationSeconds()).isGreaterThan(0);
    }

    @Test
    @DisplayName("should call Directions API for optimized route and parse response correctly")
    void callDirectionsApiSuccessfully() {
        double driverLat = 12.9250;
        double driverLng = 77.6100;
        double restaurantLat = 12.9300;
        double restaurantLng = 77.6150;
        double customerLat = 12.9400;
        double customerLng = 77.6200;

        when(redis.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn(null);

        Distance distLeg1 = new Distance("1.0 km", 1000);
        Duration durLeg1 = new Duration("3 mins", 180);
        Leg leg1 = new Leg(distLeg1, durLeg1);

        Distance distLeg2 = new Distance("2.0 km", 2000);
        Duration durLeg2 = new Duration("5 mins", 300);
        Leg leg2 = new Leg(distLeg2, durLeg2);

        Route route = new Route(List.of(leg1, leg2), new Polyline("abc_polyline"));
        DirectionsResponse mockResponse = new DirectionsResponse(List.of(route), "OK", null);

        when(restTemplate.getForObject(anyString(), eq(DirectionsResponse.class))).thenReturn(mockResponse);

        GoogleMapsService.RouteInfo routeInfo = googleMapsService.getOptimizedRoute(
                driverLat, driverLng, restaurantLat, restaurantLng, customerLat, customerLng
        );

        assertThat(routeInfo.distanceKm()).isEqualTo(3.0);
        assertThat(routeInfo.durationSeconds()).isEqualTo(480);
        assertThat(routeInfo.polyline()).isEqualTo("abc_polyline");
    }
}
