package com.eets.repository;

import com.eets.domain.SearchAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SearchAnalyticsRepository extends JpaRepository<SearchAnalytics, Long> {
    Optional<SearchAnalytics> findByKeyword(String keyword);
    List<SearchAnalytics> findTop10ByOrderBySearchCountDesc();
}
