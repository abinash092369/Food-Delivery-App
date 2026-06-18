package com.eets.repository;

import com.eets.domain.DeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {

    List<DeviceToken> findByUserIdAndIsActiveTrue(Long userId);

    Optional<DeviceToken> findByUserIdAndToken(Long userId, String token);

    boolean existsByUserIdAndToken(Long userId, String token);

    /** Deactivate a specific token for a user (used on logout / token deletion). */
    @Modifying
    @Query("UPDATE DeviceToken dt SET dt.isActive = false WHERE dt.userId = :userId AND dt.token = :token")
    void deactivateByUserIdAndToken(@Param("userId") Long userId, @Param("token") String token);

    /** Deactivate all tokens for a user (e.g., account deactivation). */
    @Modifying
    @Query("UPDATE DeviceToken dt SET dt.isActive = false WHERE dt.userId = :userId")
    void deactivateAllByUserId(@Param("userId") Long userId);

    /** Collect all active tokens for a list of users (used for batch push). */
    @Query("SELECT dt.token FROM DeviceToken dt WHERE dt.userId IN :userIds AND dt.isActive = true")
    List<String> findActiveTokensByUserIds(@Param("userIds") List<Long> userIds);

    /** Collect all active tokens for a single user. */
    @Query("SELECT dt.token FROM DeviceToken dt WHERE dt.userId = :userId AND dt.isActive = true")
    List<String> findActiveTokensByUserId(@Param("userId") Long userId);

    /** Hard-delete a token record by user + token string. */
    @Modifying
    @Query("DELETE FROM DeviceToken dt WHERE dt.userId = :userId AND dt.token = :token")
    void deleteByUserIdAndToken(@Param("userId") Long userId, @Param("token") String token);
}
