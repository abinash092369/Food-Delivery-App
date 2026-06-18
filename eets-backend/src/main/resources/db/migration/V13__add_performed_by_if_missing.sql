-- Migration V13: Ensure performed_by column exists in fraud_audit_logs table

DROP PROCEDURE IF EXISTS add_performed_by_column_if_not_exists;

DELIMITER $$
CREATE PROCEDURE add_performed_by_column_if_not_exists()
BEGIN
    DECLARE col_exists INT;
    
    SELECT COUNT(*) INTO col_exists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'fraud_audit_logs'
      AND COLUMN_NAME = 'performed_by';
      
    IF col_exists = 0 THEN
        ALTER TABLE fraud_audit_logs ADD COLUMN performed_by VARCHAR(120) DEFAULT NULL AFTER action;
    END IF;
END $$
DELIMITER ;

CALL add_performed_by_column_if_not_exists();
DROP PROCEDURE IF EXISTS add_performed_by_column_if_not_exists;
