package com.eets.controller;

import com.eets.dto.request.DriverReviewRequest;
import com.eets.dto.response.DriverReviewResponse;
import com.eets.security.CurrentUser;
import com.eets.service.DriverReviewService;
import com.eets.util.ApiResponse;
import com.eets.util.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Driver Review endpoints.
 *
 * <pre>
 * POST   /api/driver-reviews                     → submit a review (CUSTOMER)
 * GET    /api/driver-reviews/driver/{driverId}   → list reviews for a driver (public)
 * GET    /api/driver-reviews/order/{orderId}      → get review for an order (authenticated)
 * </pre>
 */
@Tag(name = "Driver Reviews", description = "Submit and retrieve driver ratings")
@RestController
@RequestMapping("/api/driver-reviews")
@RequiredArgsConstructor
public class DriverReviewController {

    private final DriverReviewService driverReviewService;

    // ── Submit a review ───────────────────────────────────────────────────────

    @Operation(
        summary     = "Submit a driver review",
        description = "Customer submits a 1-5 star rating for the driver who delivered their order. " +
                      "Rules: order must be DELIVERED, caller must own the order, " +
                      "one review per order, only the assigned driver can be reviewed."
    )
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DriverReviewResponse> create(
            @Valid @RequestBody DriverReviewRequest req) {
        return ApiResponse.ok("Review submitted", driverReviewService.create(CurrentUser.id(), req));
    }

    // ── Reviews for a driver ──────────────────────────────────────────────────

    @Operation(
        summary     = "Get reviews for a driver",
        description = "Returns paginated driver reviews, newest first. Public endpoint."
    )
    @GetMapping("/driver/{driverId}")
    public ApiResponse<PageResponse<DriverReviewResponse>> byDriver(
            @Parameter(description = "DeliveryPartner primary key")
            @PathVariable Long driverId,

            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(driverReviewService.getByDriver(driverId, page, size));
    }

    // ── Review for an order ───────────────────────────────────────────────────

    @Operation(
        summary     = "Get the driver review for a specific order",
        description = "Returns the single driver review tied to an order, or 404 if not yet reviewed."
    )
    @GetMapping("/order/{orderId}")
    public ApiResponse<DriverReviewResponse> byOrder(
            @Parameter(description = "Order primary key")
            @PathVariable Long orderId) {
        return ApiResponse.ok(driverReviewService.getByOrder(orderId));
    }
}
