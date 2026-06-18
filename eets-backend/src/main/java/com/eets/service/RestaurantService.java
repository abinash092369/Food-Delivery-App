package com.eets.service;

import com.eets.config.CacheConstants;
import com.eets.domain.*;
import com.eets.dto.response.*;
import com.eets.exception.ResourceNotFoundException;
import com.eets.repository.*;
import com.eets.util.HaversineUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class RestaurantService {

    private final RestaurantRepository restaurants;
    private final ReviewRepository reviews;
    private final CacheService cacheService;
    private final ObjectMapper json = new ObjectMapper();

    @Cacheable(value = CacheConstants.RESTAURANT_LIST, key = "{#page, #size, #city, #q, #sort, #lat, #lng}")
    public PageResponse<RestaurantCardResponse> list(int page, int size, String city, String q,
                                                     String sort, Double lat, Double lng) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Restaurant> p = restaurants.searchPublic(city, q, pageable);
        List<RestaurantCardResponse> content = p.getContent().stream()
            .map(r -> toCard(r, lat, lng)).toList();
        if (lat != null && lng != null && "DISTANCE".equalsIgnoreCase(sort)) {
            content = content.stream().sorted(Comparator.comparingDouble(c -> c.distance() == null ? Double.MAX_VALUE : c.distance())).toList();
        } else if ("RATING".equalsIgnoreCase(sort)) {
            content = content.stream().sorted((a, b) -> Double.compare(b.avgRating() == null ? 0 : b.avgRating(), a.avgRating() == null ? 0 : a.avgRating())).toList();
        }
        return new PageResponse<>(content, p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages(), p.isLast());
    }

    @Cacheable(value = CacheConstants.RESTAURANT_DETAILS, key = "#slug")
    public RestaurantDetailResponse getBySlug(String slug) {
        Restaurant r = null;
        try {
            if (slug != null && slug.matches("\\d+")) {
                r = restaurants.findById(Long.parseLong(slug)).orElse(null);
            }
        } catch (Exception e) {
            log.error("Failed to parse restaurant id: " + slug, e);
        }
        if (r == null) {
            r = restaurants.findBySlug(slug).orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));
        }
        return toDetail(r);
    }

    public RestaurantCardResponse toCard(Restaurant r, Double lat, Double lng) {
        Double distance = (lat != null && lng != null && r.getLat() != null && r.getLng() != null)
            ? HaversineUtil.km(lat, lng, r.getLat(), r.getLng()) : null;
        return new RestaurantCardResponse(r.getId(), r.getName(), r.getSlug(), r.getCoverImageUrl(),
            r.getLogoUrl(), r.getCoverImageUrl(), parseList(r.getCuisineTypes()), r.getAvgRating(), r.getTotalRatings(),
            r.getDeliveryTimeMin(), r.getDeliveryFee(), r.getMinOrderAmount(),
            isOpenNow(r), distance, r.getIsApproved(), r.getIsActive());
    }

    public RestaurantDetailResponse toDetail(Restaurant r) {
        return new RestaurantDetailResponse(r.getId(), r.getName(), r.getSlug(), r.getDescription(),
            parseList(r.getCuisineTypes()), r.getCoverImageUrl(), r.getLogoUrl(),
            r.getAddressLine(), r.getCity(), r.getState(), r.getPincode(), r.getLat(), r.getLng(),
            isOpenNow(r), r.getAvgRating(), r.getTotalRatings(),
            r.getMinOrderAmount(), r.getDeliveryTimeMin(), r.getDeliveryFee(),
            r.getOpeningTime(), r.getClosingTime(), parseIntList(r.getDaysOpen()),
            r.getIsActive(), r.getIsApproved(), r.getOwnerId(), r.getRejectionReason());
    }

    private boolean isOpenNow(Restaurant r) {
        return Boolean.TRUE.equals(r.getIsOpen());
    }

    public void recomputeRating(Long restaurantId) {
        Double avg = reviews.avgRatingForRestaurant(restaurantId);
        long count = reviews.countByRestaurantIdAndIsVisibleTrue(restaurantId);
        restaurants.findById(restaurantId).ifPresent(r -> {
            r.setAvgRating(avg == null ? 0.0 : avg);
            r.setTotalRatings((int) count);
            restaurants.save(r);
            cacheService.evictRestaurant(r.getSlug());
        });
    }

    public List<String> parseList(String jsonStr) {
        if (jsonStr == null || jsonStr.isBlank()) return List.of();
        try { return json.readValue(jsonStr, new TypeReference<List<String>>(){}); }
        catch (Exception e) { return List.of(); }
    }
    public List<Integer> parseIntList(String jsonStr) {
        if (jsonStr == null || jsonStr.isBlank()) return List.of();
        try { return json.readValue(jsonStr, new TypeReference<List<Integer>>(){}); }
        catch (Exception e) { return List.of(); }
    }
    public String toJson(Object o) {
        if (o == null) return null;
        try { return json.writeValueAsString(o); } catch (Exception e) { return null; }
    }

    public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages, boolean last) {}
}
