-- Migration V10: Add user risk scoring and fraud audit logging tables
ALTER TABLE users ADD COLUMN fraud_risk_score VARCHAR(20) NOT NULL DEFAULT 'LOW';

CREATE TABLE fraud_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    performed_by VARCHAR(120),
    target_type VARCHAR(50),
    target_id BIGINT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
