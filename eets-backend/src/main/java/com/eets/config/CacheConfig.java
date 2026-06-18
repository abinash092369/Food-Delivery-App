package com.eets.config;

import org.springframework.cache.Cache;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.databind.SerializationFeature;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
public class CacheConfig implements CachingConfigurer {

    private static final Logger log = LoggerFactory.getLogger(CacheConfig.class);

    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Redis cache GET error for key {} in cache {}: {}", key, cache.getName(), exception.getMessage());
            }

            @Override
            public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
                log.warn("Redis cache PUT error for key {} in cache {}: {}", key, cache.getName(), exception.getMessage());
            }

            @Override
            public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Redis cache EVICT error for key {} in cache {}: {}", key, cache.getName(), exception.getMessage());
            }

            @Override
            public void handleCacheClearError(RuntimeException exception, Cache cache) {
                log.warn("Redis cache CLEAR error in cache {}: {}", cache.getName(), exception.getMessage());
            }
        };
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.activateDefaultTyping(
                mapper.getPolymorphicTypeValidator(),
                ObjectMapper.DefaultTyping.NON_FINAL,
                com.fasterxml.jackson.annotation.JsonTypeInfo.As.PROPERTY
        );
        GenericJackson2JsonRedisSerializer valueSerializer = new GenericJackson2JsonRedisSerializer(mapper);

        // Default configuration: 10 minutes TTL, JSON serialization
        RedisCacheConfiguration defaultCacheConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(valueSerializer));

        // Specific configurations per cache name
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        // Restaurant List = 10 min
        cacheConfigurations.put(CacheConstants.RESTAURANT_LIST, defaultCacheConfig.entryTtl(Duration.ofMinutes(10)));
        
        // Restaurant Details = 15 min
        cacheConfigurations.put(CacheConstants.RESTAURANT_DETAILS, defaultCacheConfig.entryTtl(Duration.ofMinutes(15)));
        cacheConfigurations.put(CacheConstants.RESTAURANT_RATINGS, defaultCacheConfig.entryTtl(Duration.ofMinutes(15)));
        cacheConfigurations.put(CacheConstants.NEARBY_RESTAURANTS, defaultCacheConfig.entryTtl(Duration.ofMinutes(10)));

        // Menu Items / Menu details = 10 min
        cacheConfigurations.put(CacheConstants.MENU_DETAILS, defaultCacheConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigurations.put(CacheConstants.MENU_ITEMS, defaultCacheConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigurations.put(CacheConstants.POPULAR_ITEMS, defaultCacheConfig.entryTtl(Duration.ofMinutes(10)));

        // Search Results = 5 min
        cacheConfigurations.put(CacheConstants.SEARCH_RESULTS, defaultCacheConfig.entryTtl(Duration.ofMinutes(5)));
        cacheConfigurations.put(CacheConstants.POPULAR_SEARCHES, defaultCacheConfig.entryTtl(Duration.ofMinutes(5)));

        // Analytics = 2 min
        cacheConfigurations.put(CacheConstants.ANALYTICS_METRICS, defaultCacheConfig.entryTtl(Duration.ofMinutes(2)));
        cacheConfigurations.put(CacheConstants.REVENUE_SUMMARIES, defaultCacheConfig.entryTtl(Duration.ofMinutes(2)));
        cacheConfigurations.put(CacheConstants.ORDER_STATISTICS, defaultCacheConfig.entryTtl(Duration.ofMinutes(2)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultCacheConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }
}
