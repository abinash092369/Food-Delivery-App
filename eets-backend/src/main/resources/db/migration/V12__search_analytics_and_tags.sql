-- Migration V12: Add tags to menu items and create search analytics table

DROP PROCEDURE IF EXISTS add_tags_column_if_not_exists;

DELIMITER $$
CREATE PROCEDURE add_tags_column_if_not_exists()
BEGIN
    DECLARE col_exists INT;
    
    SELECT COUNT(*) INTO col_exists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'menu_items'
      AND COLUMN_NAME = 'tags';
      
    IF col_exists = 0 THEN
        ALTER TABLE menu_items ADD COLUMN tags VARCHAR(500) DEFAULT NULL;
    END IF;
END $$
DELIMITER ;

CALL add_tags_column_if_not_exists();
DROP PROCEDURE IF EXISTS add_tags_column_if_not_exists;

CREATE TABLE IF NOT EXISTS search_analytics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    keyword VARCHAR(150) NOT NULL UNIQUE,
    search_count INT NOT NULL DEFAULT 1,
    total_results INT NOT NULL DEFAULT 0,
    conversion_count INT NOT NULL DEFAULT 0,
    conversion_rate DOUBLE NOT NULL DEFAULT 0.0,
    last_searched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
