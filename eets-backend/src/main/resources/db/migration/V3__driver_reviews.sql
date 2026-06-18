-- ============================================================
-- V3: Driver Review System
-- EETS Backend
-- ============================================================
-- Stores one review per delivered order from the customer
-- who was assigned that specific driver.
-- ============================================================

CREATE TABLE IF NOT EXISTS driver_reviews (
    id           BIGINT        AUTO_INCREMENT PRIMARY KEY,

    -- Each order may have exactly one driver review
    order_id     BIGINT        NOT NULL,

    -- The delivery partner (driver) being reviewed
    driver_id    BIGINT        NOT NULL,

    -- The customer who placed the order
    customer_id  BIGINT        NOT NULL,

    -- Rating 1–5 (enforced in application layer too)
    rating       TINYINT       NOT NULL,

    -- Optional free-text feedback
    comment      TEXT          NULL,

    created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- ── Constraints ────────────────────────────────────────────
    -- One review per order (a customer cannot re-review)
    CONSTRAINT uq_driver_review_order UNIQUE (order_id),

    -- Rating domain check (MySQL 8 supports CHECK constraints)
    CONSTRAINT chk_driver_review_rating CHECK (rating BETWEEN 1 AND 5),

    -- ── Indexes ────────────────────────────────────────────────
    INDEX idx_dr_driver_id   (driver_id),
    INDEX idx_dr_customer_id (customer_id),
    INDEX idx_dr_created_at  (created_at),

    -- ── Foreign keys ───────────────────────────────────────────
    CONSTRAINT fk_dr_order
        FOREIGN KEY (order_id)    REFERENCES orders(id)          ON DELETE RESTRICT,
    CONSTRAINT fk_dr_driver
        FOREIGN KEY (driver_id)   REFERENCES delivery_partners(id) ON DELETE RESTRICT,
    CONSTRAINT fk_dr_customer
        FOREIGN KEY (customer_id) REFERENCES users(id)           ON DELETE RESTRICT

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
