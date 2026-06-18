-- ============================================================
-- V1: Firebase Device Token & Notification tables
-- EETS Backend — Firebase Admin SDK Integration
-- ============================================================
-- SAFE: Uses CREATE TABLE IF NOT EXISTS — will not touch data
--       in existing 'notifications' table if it already exists.
-- ============================================================

-- ----------------------------------------------------------------
-- Table: device_tokens
-- One row per device per user (multi-device support).
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS device_tokens (
    id             BIGINT       AUTO_INCREMENT PRIMARY KEY,
    user_id        BIGINT       NOT NULL,
    token          VARCHAR(4096) NOT NULL,
    platform       VARCHAR(20),          -- ANDROID | IOS | WEB
    device_name    VARCHAR(120),
    is_active      BOOLEAN      DEFAULT TRUE,
    last_used_at   TIMESTAMP    NULL,
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_device_token UNIQUE (user_id, token(500)),
    INDEX idx_dt_user_id  (user_id),
    INDEX idx_dt_is_active (is_active),
    CONSTRAINT fk_dt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------
-- Table: notifications (create only if not already present)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id            BIGINT       AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT       NOT NULL,
    title         VARCHAR(200) NOT NULL,
    body          VARCHAR(1000),
    type          VARCHAR(50),
    reference_id  BIGINT,
    is_read       BOOLEAN      DEFAULT FALSE,
    sent_via      JSON,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_notif_user_read (user_id, is_read),
    INDEX idx_notif_type      (type),
    INDEX idx_notif_created   (created_at),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------
-- Ensure users.fcm_token column exists (idempotent)
-- In MySQL 8+ we cannot use IF NOT EXISTS on ALTER TABLE ADD COLUMN,
-- so we use a stored procedure approach.
-- ----------------------------------------------------------------
DROP PROCEDURE IF EXISTS eets_add_fcm_token_column;
DELIMITER $$
CREATE PROCEDURE eets_add_fcm_token_column()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.columns
        WHERE  table_schema = DATABASE()
          AND  table_name   = 'users'
          AND  column_name  = 'fcm_token'
    ) THEN
        ALTER TABLE users ADD COLUMN fcm_token VARCHAR(500) NULL;
    END IF;
END$$
DELIMITER ;
CALL eets_add_fcm_token_column();
DROP PROCEDURE IF EXISTS eets_add_fcm_token_column;
