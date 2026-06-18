package com.eets.repository;

import com.eets.domain.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class OrderRepositoryTest {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("findByRazorpayOrderId should find the order matching razorpayOrderId")
    void testFindByRazorpayOrderId() {
        Order order = Order.builder()
                .orderNumber("ORD-100")
                .userId(1L)
                .restaurantId(10L)
                .deliveryAddressId(1L)
                .status(OrderStatus.PLACED)
                .paymentMethod(PaymentMethod.RAZORPAY)
                .paymentStatus(PaymentStatus.PENDING)
                .subtotal(BigDecimal.TEN)
                .deliveryFee(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.TEN)
                .razorpayOrderId("rz-order-abc")
                .build();
        entityManager.persist(order);
        entityManager.flush();

        Optional<Order> found = orderRepository.findByRazorpayOrderId("rz-order-abc");

        assertThat(found).isPresent();
        assertThat(found.get().getOrderNumber()).isEqualTo("ORD-100");
    }

    @Test
    @DisplayName("findByCreatedAtAfter should return orders created after a specific timestamp")
    void testFindByCreatedAtAfter() {
        Instant now = Instant.now();
        Order oldOrder = Order.builder()
                .orderNumber("ORD-OLD")
                .userId(1L)
                .restaurantId(10L)
                .deliveryAddressId(1L)
                .status(OrderStatus.PLACED)
                .paymentMethod(PaymentMethod.COD)
                .paymentStatus(PaymentStatus.PENDING)
                .subtotal(BigDecimal.TEN)
                .deliveryFee(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.TEN)
                .build();

        Order newOrder = Order.builder()
                .orderNumber("ORD-NEW")
                .userId(1L)
                .restaurantId(10L)
                .deliveryAddressId(1L)
                .status(OrderStatus.PLACED)
                .paymentMethod(PaymentMethod.COD)
                .paymentStatus(PaymentStatus.PENDING)
                .subtotal(BigDecimal.TEN)
                .deliveryFee(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.TEN)
                .build();

        entityManager.persist(oldOrder);
        entityManager.persist(newOrder);
        entityManager.flush();

        entityManager.getEntityManager().createNativeQuery(
            "UPDATE orders SET created_at = :createdAt WHERE id = :id"
        )
        .setParameter("createdAt", now.minus(2, ChronoUnit.DAYS))
        .setParameter("id", oldOrder.getId())
        .executeUpdate();

        entityManager.getEntityManager().createNativeQuery(
            "UPDATE orders SET created_at = :createdAt WHERE id = :id"
        )
        .setParameter("createdAt", now.minus(2, ChronoUnit.HOURS))
        .setParameter("id", newOrder.getId())
        .executeUpdate();

        entityManager.clear();

        Page<Order> found = orderRepository.findByCreatedAtAfter(now.minus(1, ChronoUnit.DAYS), PageRequest.of(0, 10));

        assertThat(found.getContent()).hasSize(1);
        assertThat(found.getContent().get(0).getOrderNumber()).isEqualTo("ORD-NEW");
    }

    @Test
    @DisplayName("findOrdersNeedingDriverAssignment should return orders without driver assigned that need assignment")
    void testFindOrdersNeedingDriverAssignment() {
        Instant now = Instant.now();
        // Needs driver assignment: status is ACCEPTED, deliveryPartnerId is null, createdAt < before
        Order orderNeeding = Order.builder()
                .orderNumber("ORD-NEED")
                .userId(1L)
                .restaurantId(10L)
                .deliveryAddressId(1L)
                .status(OrderStatus.ACCEPTED)
                .paymentMethod(PaymentMethod.COD)
                .paymentStatus(PaymentStatus.PENDING)
                .subtotal(BigDecimal.TEN)
                .deliveryFee(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.TEN)
                .deliveryPartnerId(null)
                .build();

        // Not needing: already has driver
        Order orderWithDriver = Order.builder()
                .orderNumber("ORD-HAS-DRIVER")
                .userId(1L)
                .restaurantId(10L)
                .deliveryAddressId(1L)
                .status(OrderStatus.ACCEPTED)
                .paymentMethod(PaymentMethod.COD)
                .paymentStatus(PaymentStatus.PENDING)
                .subtotal(BigDecimal.TEN)
                .deliveryFee(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.TEN)
                .deliveryPartnerId(5L)
                .build();

        entityManager.persist(orderNeeding);
        entityManager.persist(orderWithDriver);
        entityManager.flush();

        entityManager.getEntityManager().createNativeQuery(
            "UPDATE orders SET created_at = :createdAt WHERE id = :id"
        )
        .setParameter("createdAt", now.minus(10, ChronoUnit.MINUTES))
        .setParameter("id", orderNeeding.getId())
        .executeUpdate();

        entityManager.getEntityManager().createNativeQuery(
            "UPDATE orders SET created_at = :createdAt WHERE id = :id"
        )
        .setParameter("createdAt", now.minus(10, ChronoUnit.MINUTES))
        .setParameter("id", orderWithDriver.getId())
        .executeUpdate();

        entityManager.clear();

        Page<Order> found = orderRepository.findOrdersNeedingDriverAssignment(now.minus(5, ChronoUnit.MINUTES), PageRequest.of(0, 10));

        assertThat(found.getContent()).hasSize(1);
        assertThat(found.getContent().get(0).getOrderNumber()).isEqualTo("ORD-NEED");
    }
}
