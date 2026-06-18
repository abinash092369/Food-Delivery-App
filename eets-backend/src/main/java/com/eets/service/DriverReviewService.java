package com.eets.service;

import com.eets.domain.*;
import com.eets.dto.request.DriverReviewRequest;
import com.eets.dto.response.DriverReviewResponse;
import com.eets.exception.BadRequestException;
import com.eets.exception.ResourceNotFoundException;
import com.eets.exception.UnauthorizedException;
import com.eets.repository.*;
import com.eets.util.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Business logic for the Driver Review System.
 *
 * <h3>Business rules enforced here</h3>
 * <ol>
 *   <li>The order must be in {@link OrderStatus#DELIVERED} state.</li>
 *   <li>The caller must be the customer who placed the order.</li>
 *   <li>The order must have a completed delivery assignment linking caller's chosen driver.</li>
 *   <li>Only one review per order (idempotent guard + DB unique constraint).</li>
 *   <li>After every save, {@link DeliveryPartner#avgRating} and
 *       {@link DeliveryPartner#totalRatings} are recomputed from the DB aggregate.</li>
 * </ol>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DriverReviewService {

    private final DriverReviewRepository  driverReviews;
    private final OrderRepository         orders;
    private final DeliveryAssignmentRepository assignments;
    private final DeliveryPartnerRepository    drivers;
    private final UserRepository               users;
    private final NotificationService          notificationService;

    // ── Create ────────────────────────────────────────────────────────────────

    /**
     * Submits a new driver review.
     *
     * @param customerId  User ID extracted from the JWT (authenticated caller).
     * @param req         Review payload (orderId, rating 1-5, optional comment).
     * @return            Persisted review as a DTO.
     */
    public DriverReviewResponse create(Long customerId, DriverReviewRequest req) {

        // 1. Resolve order
        Order order = orders.findById(req.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + req.orderId()));

        // 2. Caller must own the order
        if (!order.getUserId().equals(customerId)) {
            throw new UnauthorizedException("You can only review orders you placed");
        }

        // 3. Order must be delivered
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new BadRequestException("Driver can only be reviewed after the order is delivered");
        }

        // 4. Resolve the delivery assignment – proves which driver delivered this order
        DeliveryAssignment assignment = assignments.findByOrderId(order.getId())
                .orElseThrow(() -> new BadRequestException("No delivery assignment found for this order"));

        if (assignment.getStatus() != AssignmentStatus.DELIVERED) {
            throw new BadRequestException("Delivery is not marked as completed yet");
        }

        Long driverId = assignment.getDriverId();

        // 5. One review per order
        if (driverReviews.findByOrderId(order.getId()).isPresent()) {
            throw new BadRequestException("You have already reviewed the driver for this order");
        }

        // 6. Persist
        DriverReview review = DriverReview.builder()
                .orderId(order.getId())
                .driverId(driverId)
                .customerId(customerId)
                .rating(req.rating())
                .comment(req.comment())
                .build();

        review = driverReviews.save(review);
        log.info("Driver review created: reviewId={}, driverId={}, orderId={}, rating={}",
                review.getId(), driverId, order.getId(), req.rating());

        // 7. Recompute driver's aggregate rating
        recomputeDriverRating(driverId);

        // 8. Notify the driver
        DeliveryPartner driver = drivers.findById(driverId).orElse(null);
        if (driver != null) {
            notificationService.send(
                    driver.getUserId(),
                    "New rating received",
                    req.rating() + "★ on order #" + order.getOrderNumber(),
                    "DRIVER_REVIEW",
                    review.getId()
            );
        }

        return toDto(review);
    }

    // ── Read: reviews for a driver ────────────────────────────────────────────

    /**
     * Returns paginated reviews for a given driver, newest first.
     *
     * @param driverId  DeliveryPartner PK.
     * @param page      Zero-based page index.
     * @param size      Page size.
     */
    @Transactional(readOnly = true)
    public PageResponse<DriverReviewResponse> getByDriver(Long driverId, int page, int size) {
        // Validate driver exists
        if (!drivers.existsById(driverId)) {
            throw new ResourceNotFoundException("Driver not found: " + driverId);
        }
        return PageResponse.of(
                driverReviews
                        .findByDriverIdOrderByCreatedAtDesc(driverId,
                                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                        .map(this::toDto)
        );
    }

    // ── Read: review for an order ─────────────────────────────────────────────

    /**
     * Returns the driver review for a specific order (if it exists).
     *
     * @param orderId The order PK.
     */
    @Transactional(readOnly = true)
    public DriverReviewResponse getByOrder(Long orderId) {
        DriverReview review = driverReviews.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No driver review found for order: " + orderId));
        return toDto(review);
    }

    // ── Rating recompute ──────────────────────────────────────────────────────

    /**
     * Recalculates and persists {@link DeliveryPartner#avgRating} and
     * {@link DeliveryPartner#totalRatings} from DB aggregates.
     * Called after every review save to keep the denormalised columns accurate.
     */
    public void recomputeDriverRating(Long driverId) {
        drivers.findById(driverId).ifPresent(driver -> {
            Double avg   = driverReviews.avgRatingForDriver(driverId);
            long   count = driverReviews.countByDriverId(driverId);
            driver.setAvgRating(avg == null ? 0.0 : avg);
            driver.setTotalRatings((int) count);
            drivers.save(driver);
            log.debug("Recomputed driver rating: driverId={}, avg={}, count={}", driverId, avg, count);
        });
    }

    // ── DTO mapping ───────────────────────────────────────────────────────────

    public DriverReviewResponse toDto(DriverReview r) {
        User driver   = users.findById(resolveUserId(r.getDriverId())).orElse(null);
        User customer = users.findById(r.getCustomerId()).orElse(null);
        return new DriverReviewResponse(
                r.getId(),
                r.getOrderId(),
                r.getDriverId(),
                driver   == null ? null : driver.getName(),
                r.getCustomerId(),
                customer == null ? null : customer.getName(),
                r.getRating(),
                r.getComment(),
                r.getCreatedAt()
        );
    }

    /** Resolves DeliveryPartner.id → User.id for name lookup. */
    private Long resolveUserId(Long driverId) {
        return drivers.findById(driverId)
                .map(DeliveryPartner::getUserId)
                .orElse(driverId); // fallback: won't find a user, name will be null
    }
}
