package com.eets.dto.response;

import java.time.Instant;

/**
 * Read-only projection returned from all driver-review endpoints.
 *
 * @param id           Review PK.
 * @param orderId      The order this review is attached to.
 * @param driverId     DeliveryPartner PK of the reviewed driver.
 * @param driverName   Display name of the driver (denormalised for convenience).
 * @param customerId   User PK of the reviewer.
 * @param customerName Display name of the reviewer.
 * @param rating       Star rating 1–5.
 * @param comment      Optional written feedback.
 * @param createdAt    Submission timestamp.
 */
public record DriverReviewResponse(
        Long    id,
        Long    orderId,
        Long    driverId,
        String  driverName,
        Long    customerId,
        String  customerName,
        int     rating,
        String  comment,
        Instant createdAt
) {}
