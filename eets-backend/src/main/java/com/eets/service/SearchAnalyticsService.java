package com.eets.service;

import com.eets.domain.SearchAnalytics;
import com.eets.repository.SearchAnalyticsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchAnalyticsService {

    private final SearchAnalyticsRepository searchAnalyticsRepository;

    @Transactional
    public void recordSearch(String keyword, int resultCount) {
        if (keyword == null || keyword.isBlank()) {
            return;
        }
        String cleanKeyword = keyword.trim().toLowerCase();
        searchAnalyticsRepository.findByKeyword(cleanKeyword).ifPresentOrElse(sa -> {
            sa.setSearchCount(sa.getSearchCount() + 1);
            sa.setTotalResults(resultCount);
            searchAnalyticsRepository.save(sa);
            log.debug("Incremented search count for keyword '{}' to {}", cleanKeyword, sa.getSearchCount());
        }, () -> {
            SearchAnalytics sa = SearchAnalytics.builder()
                    .keyword(cleanKeyword)
                    .searchCount(1)
                    .totalResults(resultCount)
                    .conversionCount(0)
                    .build();
            searchAnalyticsRepository.save(sa);
            log.debug("Recorded new search keyword '{}'", cleanKeyword);
        });
    }

    @Transactional
    public void recordConversion(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return;
        }
        String cleanKeyword = keyword.trim().toLowerCase();
        searchAnalyticsRepository.findByKeyword(cleanKeyword).ifPresentOrElse(sa -> {
            sa.setConversionCount(sa.getConversionCount() + 1);
            searchAnalyticsRepository.save(sa);
            log.info("Recorded search conversion for keyword '{}'", cleanKeyword);
        }, () -> {
            SearchAnalytics sa = SearchAnalytics.builder()
                    .keyword(cleanKeyword)
                    .searchCount(1) // Avoid division by zero
                    .totalResults(0)
                    .conversionCount(1)
                    .build();
            searchAnalyticsRepository.save(sa);
            log.info("Recorded conversion for new search keyword '{}'", cleanKeyword);
        });
    }

    @Transactional(readOnly = true)
    public List<String> getPopularSuggestions() {
        return searchAnalyticsRepository.findTop10ByOrderBySearchCountDesc().stream()
                .map(SearchAnalytics::getKeyword)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SearchAnalytics> getAnalyticsReport() {
        return searchAnalyticsRepository.findAll();
    }
}
