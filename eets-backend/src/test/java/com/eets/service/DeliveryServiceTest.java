package com.eets.service;

import com.eets.domain.*;
import com.eets.dto.response.DeliveryResponse;
import com.eets.repository.*;
import com.eets.websocket.DriverSocketService;
import com.eets.websocket.OrderSocketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.geo.*;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.GeoOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.domain.geo.GeoReference;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeliveryServiceTest {

    @Mock private DeliveryPartnerRepository drivers;
    @Mock private DeliveryAssignmentRepository assignments;
    @Mock private OrderRepository orders;
    @Mock private RestaurantRepository restaurants;
    @Mock private UserRepository users;
    @Mock private AddressRepository addresses;
    @Mock private DriverSocketService driverSocket;
    @Mock private OrderSocketService orderSocket;
    @Mock private NotificationService notificationService;
    @Mock private StringRedisTemplate redis;
    @Mock private PaymentService paymentService;
    @Mock private GoogleMapsService googleMapsService;
    @Mock private GeoOperations<String, String> geoOperations;
    @Mock private KafkaEventProducer kafkaEventProducer;

    @InjectMocks
    private DeliveryService deliveryService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(deliveryService, "radiusKm", 5.0);
        ReflectionTestUtils.setField(deliveryService, "baseFee", new BigDecimal("30"));
        ReflectionTestUtils.setField(deliveryService, "perKm", new BigDecimal("5"));
        ReflectionTestUtils.setField(deliveryService, "defaultDriverOperatingRadiusKm", 10.0);
        ReflectionTestUtils.setField(deliveryService, "maxNearbyDrivers", 10);

        User driverUser = User.builder().id(1000L).isActive(true).isBanned(false).build();
        org.mockito.Mockito.lenient().when(users.findById(anyLong())).thenReturn(Optional.of(driverUser));
    }

    @Test
    @DisplayName("assignDelivery - should search using Redis GEO, score drivers, optimize route and save assignment")
    void assignDeliverySuccessWithRedisGeo() {
        Long orderId = 1L;
        Order order = Order.builder()
                .id(orderId)
                .restaurantId(10L)
                .deliveryAddressId(20L)
                .build();

        Restaurant restaurant = Restaurant.builder()
                .id(10L)
                .lat(12.9716)
                .lng(77.5946)
                .name("Test Restaurant")
                .addressLine("123 Street")
                .build();

        Address address = Address.builder()
                .id(20L)
                .lat(12.9352)
                .lng(77.6245)
                .addressLine("456 Customer Ave")
                .build();

        DeliveryPartner driver = DeliveryPartner.builder()
                .id(100L)
                .userId(1000L)
                .isOnline(true)
                .isVerified(true)
                .currentLat(12.9700)
                .currentLng(77.5900)
                .operatingRadiusKm(5.0)
                .acceptanceRate(0.9)
                .completionRate(0.95)
                .avgRating(4.8)
                .build();

        when(orders.findById(orderId)).thenReturn(Optional.of(order));
        when(restaurants.findById(10L)).thenReturn(Optional.of(restaurant));
        when(addresses.findById(20L)).thenReturn(Optional.of(address));

        // Mock Redis GEOSEARCH
        when(redis.opsForGeo()).thenReturn(geoOperations);
        
        RedisGeoCommands.GeoLocation<String> geoLocation = new RedisGeoCommands.GeoLocation<>("100", new Point(77.5900, 12.9700));
        GeoResult<RedisGeoCommands.GeoLocation<String>> geoResult = new GeoResult<>(geoLocation, new Distance(0.5, RedisGeoCommands.DistanceUnit.KILOMETERS));
        GeoResults<RedisGeoCommands.GeoLocation<String>> geoResults = new GeoResults<>(List.of(geoResult));

        when(geoOperations.search(
                eq("drivers:locations"),
                any(GeoReference.class),
                any(Distance.class),
                any(RedisGeoCommands.GeoSearchCommandArgs.class)
        )).thenReturn(geoResults);

        when(drivers.findAllById(anyList())).thenReturn(List.of(driver));

        // Mock Google Directions API Route Optimization
        GoogleMapsService.RouteInfo routeInfo = new GoogleMapsService.RouteInfo(4.2, 500, "polyline_xyz");
        when(googleMapsService.getOptimizedRoute(anyDouble(), anyDouble(), anyDouble(), anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(routeInfo);

        when(assignments.save(any(DeliveryAssignment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DeliveryAssignment assignment = deliveryService.assignDelivery(orderId);

        assertThat(assignment).isNotNull();
        assertThat(assignment.getDriverId()).isEqualTo(100L);
        assertThat(assignment.getDistanceKm()).isEqualTo(4.2);
        assertThat(assignment.getRoutePolyline()).isEqualTo("polyline_xyz");
        assertThat(assignment.getEstimatedDurationMin()).isEqualTo(9);

        verify(assignments).save(any(DeliveryAssignment.class));
        verify(driverSocket).sendAssignmentToDriver(eq(100L), anyMap());
    }

    @Test
    @DisplayName("assignDelivery - should reject driver if distance to restaurant exceeds driver operating radius")
    void assignDeliveryRejectsOutsideGeofence() {
        Long orderId = 1L;
        Order order = Order.builder()
                .id(orderId)
                .restaurantId(10L)
                .deliveryAddressId(20L)
                .build();

        Restaurant restaurant = Restaurant.builder()
                .id(10L)
                .lat(12.9716)
                .lng(77.5946)
                .build();

        DeliveryPartner driver = DeliveryPartner.builder()
                .id(100L)
                .userId(1000L)
                .isOnline(true)
                .isVerified(true)
                .currentLat(12.9000)
                .currentLng(77.5000)
                .operatingRadiusKm(2.0)
                .build();

        when(orders.findById(orderId)).thenReturn(Optional.of(order));
        when(restaurants.findById(10L)).thenReturn(Optional.of(restaurant));

        when(redis.opsForGeo()).thenReturn(geoOperations);
        
        RedisGeoCommands.GeoLocation<String> geoLocation = new RedisGeoCommands.GeoLocation<>("100", new Point(77.5000, 12.9000));
        GeoResult<RedisGeoCommands.GeoLocation<String>> geoResult = new GeoResult<>(geoLocation, new Distance(4.5, RedisGeoCommands.DistanceUnit.KILOMETERS));
        GeoResults<RedisGeoCommands.GeoLocation<String>> geoResults = new GeoResults<>(List.of(geoResult));

        when(geoOperations.search(
                eq("drivers:locations"),
                any(GeoReference.class),
                any(Distance.class),
                any(RedisGeoCommands.GeoSearchCommandArgs.class)
        )).thenReturn(geoResults);

        when(drivers.findAllById(anyList())).thenReturn(List.of(driver));

        DeliveryAssignment assignment = deliveryService.assignDelivery(orderId);

        assertThat(assignment).isNull();
        verify(assignments, never()).save(any(DeliveryAssignment.class));
    }
}
