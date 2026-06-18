package com.eets.repository;

import com.eets.domain.FraudAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface FraudAuditLogRepository extends JpaRepository<FraudAuditLog, Long>, JpaSpecificationExecutor<FraudAuditLog> {
}
