package com.eets.repository;

import com.eets.domain.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    Optional<User> findByGoogleId(String googleId);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    Page<User> findByRole(Role role, Pageable pageable);
    @Query("SELECT u FROM User u WHERE (:q IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%',:q,'%'))) AND (:role IS NULL OR u.role = :role)")
    Page<User> search(@Param("q") String q, @Param("role") Role role, Pageable pageable);
    long countByCreatedAtAfter(java.time.Instant after);
    long countByIsBannedTrue();
    long countByRoleAndIsBannedTrue(Role role);
    long countByFraudRiskScore(FraudRiskScore score);
}
