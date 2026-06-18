-- Migration V11: Add index on users.fraud_risk_score to optimize risk score counts
CREATE INDEX idx_users_fraud_risk_score ON users(fraud_risk_score);
