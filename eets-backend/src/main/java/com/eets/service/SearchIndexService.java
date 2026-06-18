package com.eets.service;

import com.eets.document.CategoryDocument;
import com.eets.document.MenuItemDocument;
import com.eets.document.RestaurantDocument;
import com.eets.domain.MenuCategory;
import com.eets.domain.MenuItem;
import com.eets.domain.Restaurant;
import com.eets.repository.MenuCategoryRepository;
import com.eets.repository.MenuItemRepository;
import com.eets.repository.RestaurantRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.geo.GeoPoint;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchIndexService {

    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final MenuCategoryRepository categoryRepository;
    private final ElasticsearchOperations elasticsearchOperations;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional(readOnly = true)
    public void indexRestaurant(Long id) {
        try {
            restaurantRepository.findById(id).ifPresentOrElse(r -> {
                if (Boolean.TRUE.equals(r.getIsApproved()) && Boolean.TRUE.equals(r.getIsActive())) {
                    boolean hasVeg = menuItemRepository.existsByRestaurantIdAndIsVegTrueAndIsAvailableTrue(r.getId());
                    RestaurantDocument doc = toRestaurantDocument(r, hasVeg);
                    try {
                        elasticsearchOperations.save(doc);
                        log.info("Successfully indexed Restaurant id={}", id);
                    } catch (Exception e) {
                        log.warn("Failed to index Restaurant id={} to Elasticsearch: {}", id, e.getMessage());
                    }
                } else {
                    deleteRestaurant(id);
                }
            }, () -> deleteRestaurant(id));
        } catch (Exception e) {
            log.warn("Failed to process indexRestaurant for id={}: {}", id, e.getMessage());
        }
    }

    public void deleteRestaurant(Long id) {
        try {
            elasticsearchOperations.delete(String.valueOf(id), RestaurantDocument.class);
            log.info("Deleted Restaurant id={} from search index", id);
        } catch (Exception e) {
            log.warn("Failed to delete Restaurant id={} from Elasticsearch: {}", id, e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public void indexMenuItem(Long id) {
        try {
            menuItemRepository.findById(id).ifPresentOrElse(mi -> {
                if (Boolean.TRUE.equals(mi.getIsAvailable())) {
                    MenuItemDocument doc = toMenuItemDocument(mi);
                    try {
                        elasticsearchOperations.save(doc);
                        log.info("Successfully indexed MenuItem id={}", id);
                    } catch (Exception e) {
                        log.warn("Failed to index MenuItem id={} to Elasticsearch: {}", id, e.getMessage());
                    }
                    // Trigger re-indexing of the restaurant to update its hasVeg flag
                    indexRestaurant(mi.getRestaurantId());
                } else {
                    deleteMenuItem(id);
                }
            }, () -> deleteMenuItem(id));
        } catch (Exception e) {
            log.warn("Failed to process indexMenuItem for id={}: {}", id, e.getMessage());
        }
    }

    public void deleteMenuItem(Long id) {
        try {
            elasticsearchOperations.delete(String.valueOf(id), MenuItemDocument.class);
            log.info("Deleted MenuItem id={} from search index", id);
        } catch (Exception e) {
            log.warn("Failed to delete MenuItem id={} from Elasticsearch: {}", id, e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public void indexCategory(Long id) {
        try {
            categoryRepository.findById(id).ifPresentOrElse(c -> {
                if (Boolean.TRUE.equals(c.getIsAvailable())) {
                    CategoryDocument doc = toCategoryDocument(c);
                    try {
                        elasticsearchOperations.save(doc);
                        log.info("Successfully indexed MenuCategory id={}", id);
                    } catch (Exception e) {
                        log.warn("Failed to index MenuCategory id={} to Elasticsearch: {}", id, e.getMessage());
                    }
                } else {
                    deleteCategory(id);
                }
            }, () -> deleteCategory(id));
        } catch (Exception e) {
            log.warn("Failed to process indexCategory for id={}: {}", id, e.getMessage());
        }
    }

    public void deleteCategory(Long id) {
        try {
            elasticsearchOperations.delete(String.valueOf(id), CategoryDocument.class);
            log.info("Deleted MenuCategory id={} from search index", id);
        } catch (Exception e) {
            log.warn("Failed to delete MenuCategory id={} from Elasticsearch: {}", id, e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public void reindexAll() {
        log.info("Starting manual reindexing of all search indices...");
        try {
            // 1. Reindex categories
            List<MenuCategory> cats = categoryRepository.findAll();
            List<CategoryDocument> catDocs = cats.stream()
                    .filter(c -> Boolean.TRUE.equals(c.getIsAvailable()))
                    .map(this::toCategoryDocument)
                    .toList();
            if (!catDocs.isEmpty()) {
                try {
                    elasticsearchOperations.save(catDocs);
                } catch (Exception e) {
                    log.warn("Failed to save category documents to Elasticsearch: {}", e.getMessage());
                }
            }
            log.info("Reindexed {} categories", catDocs.size());

            // 2. Reindex menu items
            List<MenuItem> items = menuItemRepository.findAll();
            List<MenuItemDocument> itemDocs = items.stream()
                    .filter(mi -> Boolean.TRUE.equals(mi.getIsAvailable()))
                    .map(this::toMenuItemDocument)
                    .toList();
            if (!itemDocs.isEmpty()) {
                try {
                    elasticsearchOperations.save(itemDocs);
                } catch (Exception e) {
                    log.warn("Failed to save menu item documents to Elasticsearch: {}", e.getMessage());
                }
            }
            log.info("Reindexed {} menu items", itemDocs.size());

            // 3. Reindex restaurants
            List<Restaurant> rests = restaurantRepository.findAll();
            List<RestaurantDocument> restDocs = rests.stream()
                    .filter(r -> Boolean.TRUE.equals(r.getIsApproved()) && Boolean.TRUE.equals(r.getIsActive()))
                    .map(r -> {
                        boolean hasVeg = menuItemRepository.existsByRestaurantIdAndIsVegTrueAndIsAvailableTrue(r.getId());
                        return toRestaurantDocument(r, hasVeg);
                    })
                    .toList();
            if (!restDocs.isEmpty()) {
                try {
                    elasticsearchOperations.save(restDocs);
                } catch (Exception e) {
                    log.warn("Failed to save restaurant documents to Elasticsearch: {}", e.getMessage());
                }
            }
            log.info("Reindexed {} restaurants", restDocs.size());

            log.info("Manual reindexing completed successfully.");
        } catch (Exception e) {
            log.warn("Failed during manual reindexing: {}", e.getMessage());
        }
    }

    private RestaurantDocument toRestaurantDocument(Restaurant r, boolean hasVeg) {
        GeoPoint geoPoint = (r.getLat() != null && r.getLng() != null)
                ? new GeoPoint(r.getLat(), r.getLng())
                : null;

        return RestaurantDocument.builder()
                .id(r.getId())
                .name(r.getName())
                .slug(r.getSlug())
                .description(r.getDescription())
                .cuisineTypes(parseList(r.getCuisineTypes()))
                .coverImageUrl(r.getCoverImageUrl())
                .logoUrl(r.getLogoUrl())
                .addressLine(r.getAddressLine())
                .city(r.getCity())
                .state(r.getState())
                .pincode(r.getPincode())
                .location(geoPoint)
                .isOpen(r.getIsOpen())
                .isActive(r.getIsActive())
                .isApproved(r.getIsApproved())
                .avgRating(r.getAvgRating() != null ? r.getAvgRating() : 0.0)
                .totalRatings(r.getTotalRatings() != null ? r.getTotalRatings() : 0)
                .totalOrders(0) // Default to 0, updated dynamically on ranking or checkout
                .deliveryTimeMin(r.getDeliveryTimeMin() != null ? r.getDeliveryTimeMin() : 30)
                .deliveryFee(r.getDeliveryFee() != null ? r.getDeliveryFee().doubleValue() : 0.0)
                .minOrderAmount(r.getMinOrderAmount() != null ? r.getMinOrderAmount().doubleValue() : 0.0)
                .hasVeg(hasVeg)
                .build();
    }

    private MenuItemDocument toMenuItemDocument(MenuItem mi) {
        List<String> tagsList = (mi.getTags() != null && !mi.getTags().isBlank())
                ? Arrays.stream(mi.getTags().split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toList())
                : List.of();

        return MenuItemDocument.builder()
                .id(mi.getId())
                .restaurantId(mi.getRestaurantId())
                .categoryId(mi.getCategoryId())
                .name(mi.getName())
                .description(mi.getDescription())
                .price(mi.getPrice() != null ? mi.getPrice().doubleValue() : 0.0)
                .imageUrl(mi.getImageUrl())
                .isVeg(mi.getIsVeg())
                .isAvailable(mi.getIsAvailable())
                .isFeatured(mi.getIsFeatured())
                .isRecommended(mi.getIsRecommended())
                .totalOrders(mi.getTotalOrders() != null ? mi.getTotalOrders() : 0)
                .avgRating(mi.getAvgRating() != null ? mi.getAvgRating() : 0.0)
                .tags(tagsList)
                .build();
    }

    private CategoryDocument toCategoryDocument(MenuCategory c) {
        return CategoryDocument.builder()
                .id(c.getId())
                .restaurantId(c.getRestaurantId())
                .name(c.getName())
                .description(c.getDescription())
                .isAvailable(c.getIsAvailable())
                .build();
    }

    private List<String> parseList(String jsonStr) {
        if (jsonStr == null || jsonStr.isBlank()) return List.of();
        try {
            return objectMapper.readValue(jsonStr, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
