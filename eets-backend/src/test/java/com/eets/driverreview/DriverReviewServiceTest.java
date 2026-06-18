package com.eets.driverreview;

import com.eets.domain.*;
import com.eets.dto.request.DriverReviewRequest;
import com.eets.dto.response.DriverReviewResponse;
import com.eets.exception.BadRequestException;
import com.eets.exception.ResourceNotFoundException;
import com.eets.exception.UnauthorizedException;
import com.eets.repository.*;
import com.eets.service.DriverReviewService;
import com.eets.service.NotificationService;
import com.eets.util.PageResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link DriverReviewService}.
 *
 * Covers:
 * <ul>
 *   <li>Happy path – review created, rating recomputed, notification sent</li>
 *   <li>Order not found</li>
 *   <li>Caller does not own the order</li>
 *   <li>Order not yet delivered</li>
 *   <li>No delivery assignment</li>
 *   <li>Assignment not in DELIVERED status</li>
 *   <li>Duplicate review</li>
 *   <li>getByDriver – happy path and driver not found</li>
 *   <li>getByOrder – happy path and not found</li>
 *   <li>recomputeDriverRating – updates avg and count</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class DriverReviewServiceTest {

    // ── Mocks ─────────────────────────────────────────────────────────────────
    @Mock DriverReviewRepository  driverReviews;
    @Mock OrderRepository         orders;
    @Mock DeliveryAssignmentRepository assignments;
    @Mock DeliveryPartnerRepository    drivers;
    @Mock UserRepository               users;
    @Mock NotificationService          notificationService;

    @InjectMocks
    DriverReviewService service;

    // ── Fixtures ──────────────────────────────────────────────────────────────
    private static final Long CUSTOMER_ID = 10L;
    private static final Long ORDER_ID    = 20L;
    private static final Long DRIVER_ID   = 30L;   // DeliveryPartner.id
    private static final Long DRIVER_USER_ID = 31L;

    private Order deliveredOrder;
    private DeliveryAssignment completedAssignment;
    private DeliveryPartner driver;
    private User customerUser;
    private User driverUser;

    @BeforeEach
    void setUp() {
        deliveredOrder = new Order();
        deliveredOrder.setId(ORDER_ID);
        deliveredOrder.setUserId(CUSTOMER_ID);
        deliveredOrder.setStatus(OrderStatus.DELIVERED);
        deliveredOrder.setOrderNumber("ORD-001");
        deliveredOrder.setRestaurantId(1L);
        deliveredOrder.setDeliveryAddressId(1L);
        deliveredOrder.setSubtotal(BigDecimal.TEN);
        deliveredOrder.setDeliveryFee(BigDecimal.ZERO);
        deliveredOrder.setTaxAmount(BigDecimal.ZERO);
        deliveredOrder.setTotalAmount(BigDecimal.TEN);
        deliveredOrder.setPaymentMethod(PaymentMethod.COD);
        deliveredOrder.setPaymentStatus(PaymentStatus.PAID);

        completedAssignment = new DeliveryAssignment();
        completedAssignment.setOrderId(ORDER_ID);
        completedAssignment.setDriverId(DRIVER_ID);
        completedAssignment.setStatus(AssignmentStatus.DELIVERED);

        driver = new DeliveryPartner();
        driver.setId(DRIVER_ID);
        driver.setUserId(DRIVER_USER_ID);
        driver.setAvgRating(0.0);
        driver.setTotalRatings(0);

        customerUser = new User();
        customerUser.setId(CUSTOMER_ID);
        customerUser.setName("Alice");

        driverUser = new User();
        driverUser.setId(DRIVER_USER_ID);
        driverUser.setName("Bob (Driver)");
    }

    // ── create() ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("create()")
    class CreateTests {

        @Test
        @DisplayName("happy path – saves review, recomputes rating, sends notification")
        void create_happyPath() {
            DriverReviewRequest req = new DriverReviewRequest(ORDER_ID, 5, "Excellent!");

            when(orders.findById(ORDER_ID)).thenReturn(Optional.of(deliveredOrder));
            when(assignments.findByOrderId(ORDER_ID)).thenReturn(Optional.of(completedAssignment));
            when(driverReviews.findByOrderId(ORDER_ID)).thenReturn(Optional.empty());

            DriverReview saved = DriverReview.builder()
                    .id(1L).orderId(ORDER_ID).driverId(DRIVER_ID)
                    .customerId(CUSTOMER_ID).rating(5).comment("Excellent!").build();
            when(driverReviews.save(any(DriverReview.class))).thenReturn(saved);

            when(drivers.findById(DRIVER_ID)).thenReturn(Optional.of(driver));
            when(driverReviews.avgRatingForDriver(DRIVER_ID)).thenReturn(5.0);
            when(driverReviews.countByDriverId(DRIVER_ID)).thenReturn(1L);
            when(users.findById(DRIVER_USER_ID)).thenReturn(Optional.of(driverUser));
            when(users.findById(CUSTOMER_ID)).thenReturn(Optional.of(customerUser));

            DriverReviewResponse resp = service.create(CUSTOMER_ID, req);

            assertThat(resp.rating()).isEqualTo(5);
            assertThat(resp.comment()).isEqualTo("Excellent!");
            assertThat(resp.driverId()).isEqualTo(DRIVER_ID);
            assertThat(resp.customerId()).isEqualTo(CUSTOMER_ID);

            verify(driverReviews).save(any(DriverReview.class));
            verify(drivers).save(driver);  // rating recomputed
            verify(notificationService).send(eq(DRIVER_USER_ID), anyString(), anyString(), eq("DRIVER_REVIEW"), anyLong());
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when order does not exist")
        void create_orderNotFound() {
            when(orders.findById(ORDER_ID)).thenReturn(Optional.empty());
            DriverReviewRequest req = new DriverReviewRequest(ORDER_ID, 4, null);

            assertThatThrownBy(() -> service.create(CUSTOMER_ID, req))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Order not found");
        }

        @Test
        @DisplayName("throws UnauthorizedException when caller does not own the order")
        void create_notOwner() {
            deliveredOrder.setUserId(99L); // someone else's order
            when(orders.findById(ORDER_ID)).thenReturn(Optional.of(deliveredOrder));
            DriverReviewRequest req = new DriverReviewRequest(ORDER_ID, 3, null);

            assertThatThrownBy(() -> service.create(CUSTOMER_ID, req))
                    .isInstanceOf(UnauthorizedException.class)
                    .hasMessageContaining("only review orders you placed");
        }

        @Test
        @DisplayName("throws BadRequestException when order is not yet DELIVERED")
        void create_orderNotDelivered() {
            deliveredOrder.setStatus(OrderStatus.PREPARING);
            when(orders.findById(ORDER_ID)).thenReturn(Optional.of(deliveredOrder));
            DriverReviewRequest req = new DriverReviewRequest(ORDER_ID, 4, null);

            assertThatThrownBy(() -> service.create(CUSTOMER_ID, req))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("order is delivered");
        }

        @Test
        @DisplayName("throws BadRequestException when no delivery assignment exists")
        void create_noAssignment() {
            when(orders.findById(ORDER_ID)).thenReturn(Optional.of(deliveredOrder));
            when(assignments.findByOrderId(ORDER_ID)).thenReturn(Optional.empty());
            DriverReviewRequest req = new DriverReviewRequest(ORDER_ID, 4, null);

            assertThatThrownBy(() -> service.create(CUSTOMER_ID, req))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("No delivery assignment");
        }

        @Test
        @DisplayName("throws BadRequestException when assignment is not DELIVERED")
        void create_assignmentNotDelivered() {
            completedAssignment.setStatus(AssignmentStatus.ACCEPTED);
            when(orders.findById(ORDER_ID)).thenReturn(Optional.of(deliveredOrder));
            when(assignments.findByOrderId(ORDER_ID)).thenReturn(Optional.of(completedAssignment));
            DriverReviewRequest req = new DriverReviewRequest(ORDER_ID, 4, null);

            assertThatThrownBy(() -> service.create(CUSTOMER_ID, req))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("not marked as completed");
        }

        @Test
        @DisplayName("throws BadRequestException on duplicate review for same order")
        void create_duplicateReview() {
            when(orders.findById(ORDER_ID)).thenReturn(Optional.of(deliveredOrder));
            when(assignments.findByOrderId(ORDER_ID)).thenReturn(Optional.of(completedAssignment));
            DriverReview existing = DriverReview.builder().id(99L).orderId(ORDER_ID).build();
            when(driverReviews.findByOrderId(ORDER_ID)).thenReturn(Optional.of(existing));
            DriverReviewRequest req = new DriverReviewRequest(ORDER_ID, 3, "again");

            assertThatThrownBy(() -> service.create(CUSTOMER_ID, req))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("already reviewed");
        }
    }

    // ── getByDriver() ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getByDriver()")
    class GetByDriverTests {

        @Test
        @DisplayName("returns paginated reviews for a valid driver")
        void getByDriver_happyPath() {
            when(drivers.existsById(DRIVER_ID)).thenReturn(true);
            DriverReview r = DriverReview.builder().id(1L).orderId(ORDER_ID)
                    .driverId(DRIVER_ID).customerId(CUSTOMER_ID).rating(4).build();
            Page<DriverReview> page = new PageImpl<>(List.of(r));
            when(driverReviews.findByDriverIdOrderByCreatedAtDesc(eq(DRIVER_ID), any(Pageable.class)))
                    .thenReturn(page);
            when(drivers.findById(DRIVER_ID)).thenReturn(Optional.of(driver));
            when(users.findById(DRIVER_USER_ID)).thenReturn(Optional.of(driverUser));
            when(users.findById(CUSTOMER_ID)).thenReturn(Optional.of(customerUser));

            PageResponse<DriverReviewResponse> resp = service.getByDriver(DRIVER_ID, 0, 20);

            assertThat(resp.content()).hasSize(1);
            assertThat(resp.content().get(0).rating()).isEqualTo(4);
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when driver does not exist")
        void getByDriver_driverNotFound() {
            when(drivers.existsById(DRIVER_ID)).thenReturn(false);

            assertThatThrownBy(() -> service.getByDriver(DRIVER_ID, 0, 20))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Driver not found");
        }
    }

    // ── getByOrder() ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getByOrder()")
    class GetByOrderTests {

        @Test
        @DisplayName("returns review when it exists")
        void getByOrder_found() {
            DriverReview r = DriverReview.builder().id(1L).orderId(ORDER_ID)
                    .driverId(DRIVER_ID).customerId(CUSTOMER_ID).rating(5).comment("Great").build();
            when(driverReviews.findByOrderId(ORDER_ID)).thenReturn(Optional.of(r));
            when(drivers.findById(DRIVER_ID)).thenReturn(Optional.of(driver));
            when(users.findById(DRIVER_USER_ID)).thenReturn(Optional.of(driverUser));
            when(users.findById(CUSTOMER_ID)).thenReturn(Optional.of(customerUser));

            DriverReviewResponse resp = service.getByOrder(ORDER_ID);

            assertThat(resp.orderId()).isEqualTo(ORDER_ID);
            assertThat(resp.rating()).isEqualTo(5);
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when no review exists for order")
        void getByOrder_notFound() {
            when(driverReviews.findByOrderId(ORDER_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getByOrder(ORDER_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("No driver review found");
        }
    }

    // ── recomputeDriverRating() ───────────────────────────────────────────────

    @Nested
    @DisplayName("recomputeDriverRating()")
    class RecomputeTests {

        @Test
        @DisplayName("updates avgRating and totalRatings on DeliveryPartner")
        void recompute_updatesFields() {
            when(drivers.findById(DRIVER_ID)).thenReturn(Optional.of(driver));
            when(driverReviews.avgRatingForDriver(DRIVER_ID)).thenReturn(4.2);
            when(driverReviews.countByDriverId(DRIVER_ID)).thenReturn(5L);

            service.recomputeDriverRating(DRIVER_ID);

            assertThat(driver.getAvgRating()).isEqualTo(4.2);
            assertThat(driver.getTotalRatings()).isEqualTo(5);
            verify(drivers).save(driver);
        }

        @Test
        @DisplayName("sets avgRating to 0.0 when no reviews exist (null from AVG)")
        void recompute_nullAvgBecomesZero() {
            when(drivers.findById(DRIVER_ID)).thenReturn(Optional.of(driver));
            when(driverReviews.avgRatingForDriver(DRIVER_ID)).thenReturn(null);
            when(driverReviews.countByDriverId(DRIVER_ID)).thenReturn(0L);

            service.recomputeDriverRating(DRIVER_ID);

            assertThat(driver.getAvgRating()).isEqualTo(0.0);
            assertThat(driver.getTotalRatings()).isEqualTo(0);
        }
    }
}
