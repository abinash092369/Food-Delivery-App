package com.eets.repository;

import com.eets.domain.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface UserFavoriteRepository extends JpaRepository<UserFavorite, Long> {

    List<UserFavorite> findByUserId(Long userId);
    Optional<UserFavorite> findByUserIdAndTypeAndReferenceId(Long userId, FavoriteType type, Long refId);
}
