package com.eets.order;

import com.eets.domain.*;
import com.eets.dto.request.*;
import com.eets.dto.response.*;
import com.eets.exception.*;
import com.eets.repository.*;
import com.eets.service.*;
import com.eets.util.OrderNumberGenerator;
import com.eets.websocket.AdminSocketService;
import com.eets.websocket.OrderSocketService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock private OrderRepository orders;
    @Mock private OrderItemRepository orderItems;
    @Mock private OrderStatusHistoryRepository history;
    @Mock private CartRepository carts;
    @Mock private CartItemRepository cartItems;
    @Mock private MenuItemRepository menuItems;
    @Mock private RestaurantRepository restaurants;
    @Mock private UserRepository users;
    @Mock private AddressRepository addresses;
    @Mock private DeliveryPartnerRepository drivers;
    @Mock private OrderNumberGenerator numberGen;
    @Mock private PaymentService paymentService;
    @Mock private CouponService couponService;
    @Mock private DeliveryService deliveryService;
    @Mock private NotificationService notificationService;
    @Mock private OrderSocketService orderSocket;
    @Mock private AdminSocketService adminSocket;
    @Mock private StringRedisTemplate redis;
    @Mock private FraudService fraudService;
    @Mock private KafkaEventProducer kafkaEventProducer;
    @Mock private OrderAsyncService orderAsyncService;

    @InjectMocks
    private OrderService orderService;

    @Test
    @DisplayName("initiate(): happy path COD order -> order saved, cart cleared, restaurant notified")
    void initiate_happyPathCOD() {
        Long userId = 1L;
        InitiateOrderRequest req = new InitiateOrderRequest(10L, PaymentMethod.COD, null, null);
        Cart cart = Cart.builder().id(20L).userId(userId).restaurantId(50L).build();
        CartItem cartItem = CartItem.builder().id(30L).cartId(20L).menuItemId(100L).quantity(2).itemPrice(BigDecimal.valueOf(100.00)).totalPrice(BigDecimal.valueOf(200.00)).build();
        Address address = Address.builder().id(10L).userId(userId).addressLine("Street").city("City").build();
        Restaurant restaurant = Restaurant.builder().id(50L).name("Pizza Place").deliveryFee(BigDecimal.valueOf(30.00)).deliveryTimeMin(30).ownerId(88L).build();
        User user = User.builder().id(userId).name("Alice").email("alice@gmail.com").phone("1234567890").build();
        Order order = Order.builder().id(500L).orderNumber("ORD-12345").userId(userId).restaurantId(50L).totalAmount(BigDecimal.valueOf(266.00)).build();

        when(carts.findByUserId(userId)).thenReturn(Optional.of(cart));
        when(cartItems.findByCartId(20L)).thenReturn(List.of(cartItem));
        when(addresses.findById(10L)).thenReturn(Optional.of(address));
        when(restaurants.findById(50L)).thenReturn(Optional.of(restaurant));
        when(numberGen.next()).thenReturn("ORD-12345");
        when(orders.save(any(Order.class))).thenReturn(order);
        when(users.findById(userId)).thenReturn(Optional.of(user));

        InitiateOrderResponse resp = orderService.initiate(userId, req);

        assertThat(resp).isNotNull();
        assertThat(resp.orderNumber()).isEqualTo("ORD-12345");
        assertThat(resp.razorpayOrderId()).isNull(); // COD order should have null razorpayOrderId

        // Verifications for confirmOrder (which clears cart and delegates to async service)
        verify(cartItems).deleteByCartId(20L);
        verify(carts).save(any(Cart.class));
        verify(orderAsyncService).confirmOrderAsync(eq(500L), eq(userId));
    }

    @Test
    @DisplayName("initiate(): happy path Razorpay order -> Razorpay order created, razorpayOrderId set")
    void initiate_happyPathRazorpay() {
        Long userId = 1L;
        InitiateOrderRequest req = new InitiateOrderRequest(10L, PaymentMethod.RAZORPAY, null, null);
        Cart cart = Cart.builder().id(20L).userId(userId).restaurantId(50L).build();
        CartItem cartItem = CartItem.builder().id(30L).cartId(20L).menuItemId(100L).quantity(2).itemPrice(BigDecimal.valueOf(100.00)).totalPrice(BigDecimal.valueOf(200.00)).build();
        Address address = Address.builder().id(10L).userId(userId).addressLine("Street").city("City").build();
        Restaurant restaurant = Restaurant.builder().id(50L).name("Pizza Place").deliveryFee(BigDecimal.valueOf(30.00)).deliveryTimeMin(30).ownerId(88L).build();
        User user = User.builder().id(userId).name("Alice").email("alice@gmail.com").phone("1234567890").build();
        Order order = Order.builder().id(500L).orderNumber("ORD-12345").userId(userId).restaurantId(50L).totalAmount(BigDecimal.valueOf(266.00)).build();

        when(carts.findByUserId(userId)).thenReturn(Optional.of(cart));
        when(cartItems.findByCartId(20L)).thenReturn(List.of(cartItem));
        when(addresses.findById(10L)).thenReturn(Optional.of(address));
        when(restaurants.findById(50L)).thenReturn(Optional.of(restaurant));
        when(numberGen.next()).thenReturn("ORD-12345");
        when(orders.save(any(Order.class))).thenReturn(order);
        when(users.findById(userId)).thenReturn(Optional.of(user));
        when(paymentService.createOrder(any(), eq(userId))).thenReturn(new PaymentService.RazorpayOrder("rz-order-1", BigDecimal.valueOf(266.00), "INR"));
        when(paymentService.getKeyId()).thenReturn("rz-key-id");

        InitiateOrderResponse resp = orderService.initiate(userId, req);

        assertThat(resp).isNotNull();
        assertThat(resp.razorpayOrderId()).isEqualTo("rz-order-1");
        verify(paymentService).createOrder(any(), eq(userId));
    }

    @Test
    @DisplayName("initiate(): empty cart -> throws BadRequestException")
    void initiate_emptyCart() {
        Long userId = 1L;
        InitiateOrderRequest req = new InitiateOrderRequest(10L, PaymentMethod.COD, null, null);

        when(carts.findByUserId(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.initiate(userId, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Cart empty");
    }

    @Test
    @DisplayName("initiate(): address not belonging to user -> throws UnauthorizedException")
    void initiate_addressNotBelongingToUser() {
        Long userId = 1L;
        InitiateOrderRequest req = new InitiateOrderRequest(10L, PaymentMethod.COD, null, null);
        Cart cart = Cart.builder().id(20L).userId(userId).restaurantId(50L).build();
        CartItem cartItem = CartItem.builder().id(30L).cartId(20L).menuItemId(100L).quantity(2).itemPrice(BigDecimal.valueOf(100.00)).totalPrice(BigDecimal.valueOf(200.00)).build();
        Address address = Address.builder().id(10L).userId(99L).build(); // Belongs to user 99L

        when(carts.findByUserId(userId)).thenReturn(Optional.of(cart));
        when(cartItems.findByCartId(20L)).thenReturn(List.of(cartItem));
        when(addresses.findById(10L)).thenReturn(Optional.of(address));

        assertThatThrownBy(() -> orderService.initiate(userId, req))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Address not yours");
    }

    @Test
    @DisplayName("initiate(): valid coupon -> discount applied, coupon usage recorded")
    void initiate_validCoupon() {
        Long userId = 1L;
        InitiateOrderRequest req = new InitiateOrderRequest(10L, PaymentMethod.COD, "DISCOUNT20", null);
        Cart cart = Cart.builder().id(20L).userId(userId).restaurantId(50L).build();
        CartItem cartItem = CartItem.builder().id(30L).cartId(20L).menuItemId(100L).quantity(2).itemPrice(BigDecimal.valueOf(100.00)).totalPrice(BigDecimal.valueOf(200.00)).build();
        Address address = Address.builder().id(10L).userId(userId).addressLine("Street").city("City").build();
        Restaurant restaurant = Restaurant.builder().id(50L).name("Pizza Place").deliveryFee(BigDecimal.valueOf(30.00)).deliveryTimeMin(30).ownerId(88L).build();
        User user = User.builder().id(userId).name("Alice").email("alice@gmail.com").phone("1234567890").build();
        Coupon coupon = Coupon.builder().id(5L).code("DISCOUNT20").type(CouponType.PERCENTAGE).value(BigDecimal.valueOf(20)).build();
        Order order = Order.builder().id(500L).orderNumber("ORD-12345").userId(userId).restaurantId(50L).couponId(5L).discountAmount(BigDecimal.valueOf(40.00)).totalAmount(BigDecimal.valueOf(226.00)).build();

        when(carts.findByUserId(userId)).thenReturn(Optional.of(cart));
        when(cartItems.findByCartId(20L)).thenReturn(List.of(cartItem));
        when(addresses.findById(10L)).thenReturn(Optional.of(address));
        when(restaurants.findById(50L)).thenReturn(Optional.of(restaurant));
        when(numberGen.next()).thenReturn("ORD-12345");
        when(couponService.findOrThrow("DISCOUNT20")).thenReturn(coupon);
        when(couponService.calculateDiscount(any(), any())).thenReturn(BigDecimal.valueOf(40.00));
        when(orders.save(any(Order.class))).thenReturn(order);
        when(users.findById(userId)).thenReturn(Optional.of(user));

        InitiateOrderResponse resp = orderService.initiate(userId, req);

        assertThat(resp).isNotNull();
        verify(couponService).recordUsage(eq(coupon), eq(userId), eq(500L), any());
    }

    @Test
    @DisplayName("verifyPayment(): valid signature -> payment status set to PAID, confirmOrder called")
    void verifyPayment_validSignature() {
        Long userId = 1L;
        VerifyPaymentRequest req = new VerifyPaymentRequest("rz-order-1", "pay-1", "sig-1", 500L);
        Order order = Order.builder()
                .id(500L)
                .userId(userId)
                .restaurantId(50L)
                .paymentStatus(PaymentStatus.PENDING)
                .orderNumber("ORD-12345")
                .totalAmount(BigDecimal.valueOf(100.00))
                .build();
        when(orders.findByRazorpayOrderId("rz-order-1")).thenReturn(Optional.of(order));
        when(carts.findByUserId(userId)).thenReturn(Optional.empty()); // for confirmOrder

        Map<String, Object> result = orderService.verifyPayment(userId, req);

        assertThat(result).isNotNull();
        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        verify(orders).save(order);
        verify(paymentService).verifySignature("rz-order-1", "pay-1", "sig-1");
        verify(orderAsyncService).confirmOrderAsync(eq(500L), eq(userId));
    }

    @Test
    @DisplayName("verifyPayment(): invalid signature -> throws PaymentException")
    void verifyPayment_invalidSignature() {
        Long userId = 1L;
        VerifyPaymentRequest req = new VerifyPaymentRequest("rz-order-1", "pay-1", "sig-invalid", 500L);

        doThrow(new PaymentException("Signature mismatch"))
                .when(paymentService).verifySignature("rz-order-1", "pay-1", "sig-invalid");

        assertThatThrownBy(() -> orderService.verifyPayment(userId, req))
                .isInstanceOf(PaymentException.class)
                .hasMessageContaining("Signature mismatch");
    }

    @Test
    @DisplayName("cancelOrder(): cancellable status -> status set to CANCELLED")
    void cancelOrder_cancellable() {
        Long userId = 1L;
        Order order = Order.builder().id(500L).userId(userId).restaurantId(50L).status(OrderStatus.ACCEPTED).paymentMethod(PaymentMethod.COD).build();

        when(orders.findById(500L)).thenReturn(Optional.of(order));

        orderService.cancelOrder(userId, 500L, "Changed my mind");

        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        verify(orders).save(order);
        verify(history).save(any());
    }

    @Test
    @DisplayName("cancelOrder(): non-cancellable status (e.g. DELIVERED) -> throws BadRequestException")
    void cancelOrder_nonCancellable() {
        Long userId = 1L;
        Order order = Order.builder().id(500L).userId(userId).status(OrderStatus.DELIVERED).build();

        when(orders.findById(500L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.cancelOrder(userId, 500L, "Late refund request"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Cannot cancel at this stage");
    }

    @Test
    @DisplayName("cancelOrder(): paid order cancelled -> refund initiated, status REFUNDED")
    void cancelOrder_paidRazorpay() {
        Long userId = 1L;
        Order order = Order.builder()
                .id(500L)
                .userId(userId)
                .restaurantId(50L)
                .paymentMethod(PaymentMethod.RAZORPAY)
                .paymentStatus(PaymentStatus.PAID)
                .status(OrderStatus.ACCEPTED)
                .totalAmount(BigDecimal.valueOf(150.00))
                .razorpayPaymentId("pay_123")
                .build();

        when(orders.findById(500L)).thenReturn(Optional.of(order));

        orderService.cancelOrder(userId, 500L, "No driver");

        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.REFUNDED);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.REFUNDED);
        verify(paymentService).refund("pay_123", BigDecimal.valueOf(150.00));
        verify(orders).save(order);
    }

    @Test
    @DisplayName("vendorUpdateStatus(): happy path -> updates status and registers afterCommit callback")
    void vendorUpdateStatus_happyPath() {
        Long vendorUserId = 88L;
        Long orderId = 500L;
        Order order = Order.builder()
                .id(orderId)
                .userId(1L)
                .restaurantId(50L)
                .status(OrderStatus.PLACED)
                .totalAmount(BigDecimal.valueOf(100.00))
                .build();
        Restaurant restaurant = Restaurant.builder()
                .id(50L)
                .ownerId(vendorUserId)
                .build();

        when(orders.findByIdForUpdate(orderId)).thenReturn(Optional.of(order));
        when(restaurants.findById(50L)).thenReturn(Optional.of(restaurant));
        when(orders.saveAndFlush(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orders.findAllById(List.of(orderId))).thenReturn(List.of(order));

        OrderResponse resp = orderService.vendorUpdateStatus(vendorUserId, orderId, OrderStatus.ACCEPTED);

        assertThat(resp).isNotNull();
        assertThat(order.getStatus()).isEqualTo(OrderStatus.ACCEPTED);
        verify(orders).saveAndFlush(order);
        verify(orderAsyncService).handlePostStatusUpdateAsync(eq(orderId), eq(OrderStatus.ACCEPTED), eq(vendorUserId));
    }

    @Test
    @DisplayName("vendorUpdateStatus(): already in target status -> returns early without update")
    void vendorUpdateStatus_alreadyInTargetStatus() {
        Long vendorUserId = 88L;
        Long orderId = 500L;
        Order order = Order.builder()
                .id(orderId)
                .userId(1L)
                .restaurantId(50L)
                .status(OrderStatus.ACCEPTED)
                .build();

        when(orders.findByIdForUpdate(orderId)).thenReturn(Optional.of(order));
        when(orders.findAllById(List.of(orderId))).thenReturn(List.of(order));

        OrderResponse resp = orderService.vendorUpdateStatus(vendorUserId, orderId, OrderStatus.ACCEPTED);

        assertThat(resp).isNotNull();
        verify(orders, never()).saveAndFlush(any());
        verify(orderAsyncService, never()).handlePostStatusUpdateAsync(any(), any(), any());
    }

    @Test
    @DisplayName("vendorUpdateStatus(): order in terminal status -> returns early without update")
    void vendorUpdateStatus_terminalStatus() {
        Long vendorUserId = 88L;
        Long orderId = 500L;
        Order order = Order.builder()
                .id(orderId)
                .userId(1L)
                .restaurantId(50L)
                .status(OrderStatus.DELIVERED)
                .build();

        when(orders.findByIdForUpdate(orderId)).thenReturn(Optional.of(order));
        when(orders.findAllById(List.of(orderId))).thenReturn(List.of(order));

        OrderResponse resp = orderService.vendorUpdateStatus(vendorUserId, orderId, OrderStatus.ACCEPTED);

        assertThat(resp).isNotNull();
        verify(orders, never()).saveAndFlush(any());
        verify(orderAsyncService, never()).handlePostStatusUpdateAsync(any(), any(), any());
    }
}
