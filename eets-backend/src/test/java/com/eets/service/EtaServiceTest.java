package com.eets.service;

import com.eets.domain.*;
import com.eets.dto.response.EtaPayload;
import com.eets.repository.AddressRepository;
import com.eets.repository.DeliveryAssignmentRepository;
import com.eets.repository.OrderRepository;
import com.eets.websocket.OrderSocketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EtaServiceTest {

    @Mock private DeliveryAssignmentRepository assignmentRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private AddressRepository addressRepository;
    @Mock private com.eets.repository.RestaurantRepository restaurantRepository;
    @Mock private OrderSocketService orderSocketService;
    @Mock private GoogleMapsService googleMapsService;

    @InjectMocks
    private EtaService etaService;

    private static final Long ORDER_ID = 123L;
    private static final Long ADDRESS_ID = 456L;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(etaService, "averageSpeedKmh", 30.0);
    }

    @Test
    @DisplayName("happy path - recalculates ETA, updates DB and broadcasts WebSocket events")
    void recalculate_happyPath() {
        DeliveryAssignment assignment = new DeliveryAssignment();
        assignment.setId(1L);
        assignment.setOrderId(ORDER_ID);
        assignment.setStatus(AssignmentStatus.ACCEPTED);

        Order order = new Order();
        order.setId(ORDER_ID);
        order.setDeliveryAddressId(ADDRESS_ID);
        order.setRestaurantId(789L);

        Address address = new Address();
        address.setId(ADDRESS_ID);
        address.setLat(12.9716);
        address.setLng(77.5946);

        Restaurant restaurant = new Restaurant();
        restaurant.setId(789L);
        restaurant.setLat(12.9500);
        restaurant.setLng(77.6000);

        when(assignmentRepository.findByOrderId(ORDER_ID)).thenReturn(Optional.of(assignment));
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));
        when(addressRepository.findById(ADDRESS_ID)).thenReturn(Optional.of(address));
        when(restaurantRepository.findById(789L)).thenReturn(Optional.of(restaurant));
        
        GoogleMapsService.RouteInfo routeInfo = new GoogleMapsService.RouteInfo(4.5, 540, "abc_polyline");
        when(googleMapsService.getOptimizedRoute(anyDouble(), anyDouble(), anyDouble(), anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(routeInfo);

        double driverLat = 12.9352;
        double driverLng = 77.6245;

        Integer etaMin = etaService.recalculateAndBroadcast(ORDER_ID, driverLat, driverLng);

        assertThat(etaMin).isEqualTo(9);
        verify(orderRepository).save(order);
        verify(assignmentRepository).save(assignment);
        verify(orderSocketService).broadcastEta(eq(ORDER_ID), any(EtaPayload.class));
    }

    @Test
    @DisplayName("recalculate returns null when no assignment is found")
    void recalculate_noAssignment() {
        when(assignmentRepository.findByOrderId(ORDER_ID)).thenReturn(Optional.empty());

        Integer etaMin = etaService.recalculateAndBroadcast(ORDER_ID, 12.9, 77.6);

        assertThat(etaMin).isNull();
        verifyNoInteractions(orderRepository, addressRepository, orderSocketService);
    }

    @Test
    @DisplayName("recalculate returns null when assignment status is terminal")
    void recalculate_terminalAssignment() {
        DeliveryAssignment assignment = new DeliveryAssignment();
        assignment.setId(1L);
        assignment.setOrderId(ORDER_ID);
        assignment.setStatus(AssignmentStatus.DELIVERED);

        when(assignmentRepository.findByOrderId(ORDER_ID)).thenReturn(Optional.of(assignment));

        Integer etaMin = etaService.recalculateAndBroadcast(ORDER_ID, 12.9, 77.6);

        assertThat(etaMin).isNull();
        verifyNoInteractions(orderRepository, addressRepository, orderSocketService);
    }

    @Test
    @DisplayName("recalculate returns null when order is not found")
    void recalculate_orderNotFound() {
        DeliveryAssignment assignment = new DeliveryAssignment();
        assignment.setId(1L);
        assignment.setOrderId(ORDER_ID);
        assignment.setStatus(AssignmentStatus.ACCEPTED);

        when(assignmentRepository.findByOrderId(ORDER_ID)).thenReturn(Optional.of(assignment));
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.empty());

        Integer etaMin = etaService.recalculateAndBroadcast(ORDER_ID, 12.9, 77.6);

        assertThat(etaMin).isNull();
        verifyNoInteractions(addressRepository, orderSocketService);
    }

    @Test
    @DisplayName("recalculate returns null when delivery address is missing coordinates")
    void recalculate_missingAddressCoordinates() {
        DeliveryAssignment assignment = new DeliveryAssignment();
        assignment.setId(1L);
        assignment.setOrderId(ORDER_ID);
        assignment.setStatus(AssignmentStatus.ACCEPTED);

        Order order = new Order();
        order.setId(ORDER_ID);
        order.setDeliveryAddressId(ADDRESS_ID);

        Address address = new Address();
        address.setId(ADDRESS_ID);
        address.setLat(null);

        when(assignmentRepository.findByOrderId(ORDER_ID)).thenReturn(Optional.of(assignment));
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));
        when(addressRepository.findById(ADDRESS_ID)).thenReturn(Optional.of(address));

        Integer etaMin = etaService.recalculateAndBroadcast(ORDER_ID, 12.9, 77.6);

        assertThat(etaMin).isNull();
        verify(orderRepository, never()).save(any(Order.class));
        verifyNoInteractions(orderSocketService);
    }
}
