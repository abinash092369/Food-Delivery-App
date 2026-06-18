package com.eets.service;

import com.eets.config.CacheConstants;
import com.eets.domain.Restaurant;
import com.eets.dto.response.RestaurantDetailResponse;
import com.eets.repository.RestaurantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
class CacheIntegrationTest {

    @Autowired
    private RestaurantService restaurantService;

    @Autowired
    private CacheManager cacheManager;

    @MockBean
    private RestaurantRepository restaurantRepository;

    @MockBean
    private com.eets.repository.ReviewRepository reviewRepository;

    @TestConfiguration
    static class TestCacheConfig {
        @Bean
        @Primary
        public CacheManager testCacheManager() {
            return new ConcurrentMapCacheManager(
                    CacheConstants.RESTAURANT_LIST,
                    CacheConstants.RESTAURANT_DETAILS,
                    CacheConstants.MENU_DETAILS,
                    CacheConstants.MENU_ITEMS,
                    CacheConstants.SEARCH_RESULTS,
                    CacheConstants.ANALYTICS_METRICS,
                    CacheConstants.REVENUE_SUMMARIES,
                    CacheConstants.ORDER_STATISTICS
            );
        }
    }

    @BeforeEach
    void setUp() {
        cacheManager.getCacheNames().forEach(name -> {
            var cache = cacheManager.getCache(name);
            if (cache != null) {
                cache.clear();
            }
        });
    }

    @Test
    void testRestaurantDetailCachingAndEviction() {
        String slug = "test-restaurant";
        Restaurant r = Restaurant.builder()
                .id(1L)
                .name("Test Restaurant")
                .slug(slug)
                .isOpen(true)
                .build();

        when(restaurantRepository.findBySlug(slug)).thenReturn(Optional.of(r));

        // First read: should miss cache and fetch from repository
        RestaurantDetailResponse response1 = restaurantService.getBySlug(slug);
        assertThat(response1).isNotNull();
        assertThat(response1.name()).isEqualTo("Test Restaurant");

        // Second read: should hit cache and NOT call repository again
        RestaurantDetailResponse response2 = restaurantService.getBySlug(slug);
        assertThat(response2).isNotNull();

        verify(restaurantRepository, times(1)).findBySlug(slug);

        // recomputeRating updates restaurant in DB and evicts details from cache
        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(r));
        restaurantService.recomputeRating(1L);

        // Third read: should miss cache and fetch from repository again
        RestaurantDetailResponse response3 = restaurantService.getBySlug(slug);
        assertThat(response3).isNotNull();

        verify(restaurantRepository, times(2)).findBySlug(slug);
    }
}
