package com.eets.controller;

import com.eets.domain.SearchAnalytics;
import com.eets.dto.response.MenuItemResponse;
import com.eets.dto.response.RestaurantCardResponse;
import com.eets.dto.response.UnifiedSearchResponse;
import com.eets.search.MenuItemFilter;
import com.eets.search.RestaurantFilter;
import com.eets.search.SearchService;
import com.eets.service.SearchAnalyticsService;
import com.eets.service.SearchIndexService;
import com.eets.util.ApiResponse;
import com.eets.util.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Search", description = "Advanced search with filtering, sorting, pagination, and Elasticsearch")
@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;
    private final SearchIndexService searchIndexService;
    private final SearchAnalyticsService searchAnalyticsService;

    // ── Restaurants ───────────────────────────────────────────────────────────

    @Operation(
        summary     = "Advanced restaurant search",
        description = "Filter by keyword, cuisine, vegOnly, minRating, maxDeliveryTime, " +
                      "minPrice/maxPrice (delivery fee). Sort by rating|deliveryTime|price|distance."
    )
    @GetMapping("/restaurants")
    public ApiResponse<PageResponse<RestaurantCardResponse>> restaurants(
            @Parameter(description = "Free-text search on name / cuisine")
            @RequestParam(required = false) String keyword,

            @Parameter(description = "Filter by cuisine type (e.g. Italian)")
            @RequestParam(required = false) String cuisine,

            @Parameter(description = "Only show restaurants with veg items")
            @RequestParam(required = false) Boolean vegOnly,

            @Parameter(description = "Minimum average rating (0-5)")
            @RequestParam(required = false) Double minRating,

            @Parameter(description = "Maximum delivery time in minutes")
            @RequestParam(required = false) Integer maxDeliveryTime,

            @Parameter(description = "Minimum delivery fee")
            @RequestParam(required = false) java.math.BigDecimal minPrice,

            @Parameter(description = "Maximum delivery fee")
            @RequestParam(required = false) java.math.BigDecimal maxPrice,

            @Parameter(description = "Sort field: rating | deliveryTime | price | distance")
            @RequestParam(required = false, defaultValue = "rating") String sortBy,

            @Parameter(description = "Sort direction: asc | desc")
            @RequestParam(required = false, defaultValue = "desc") String direction,

            @Parameter(description = "Caller latitude (required for distance sort)")
            @RequestParam(required = false) Double lat,

            @Parameter(description = "Caller longitude (required for distance sort)")
            @RequestParam(required = false) Double lng,

            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {

        RestaurantFilter filter = new RestaurantFilter();
        filter.setKeyword(keyword);
        filter.setCuisine(cuisine);
        filter.setVegOnly(vegOnly);
        filter.setMinRating(minRating);
        filter.setMaxDeliveryTime(maxDeliveryTime);
        filter.setMinPrice(minPrice);
        filter.setMaxPrice(maxPrice);
        filter.setSortBy(sortBy);
        filter.setDirection(direction);
        filter.setLat(lat);
        filter.setLng(lng);
        filter.setPage(page);
        filter.setSize(size);

        return ApiResponse.ok(searchService.searchRestaurants(filter));
    }

    // ── Menu Items ────────────────────────────────────────────────────────────

    @Operation(
        summary     = "Advanced menu-item search",
        description = "Filter by keyword, vegOnly, minRating, minPrice/maxPrice, " +
                      "restaurantId, categoryId. Sort by rating|price|name."
    )
    @GetMapping("/menu-items")
    public ApiResponse<PageResponse<MenuItemResponse>> menuItems(
            @Parameter(description = "Free-text search on name / description")
            @RequestParam(required = false) String keyword,

            @Parameter(description = "Only vegetarian items")
            @RequestParam(required = false) Boolean vegOnly,

            @Parameter(description = "Minimum average rating (0-5)")
            @RequestParam(required = false) Double minRating,

            @Parameter(description = "Minimum price")
            @RequestParam(required = false) java.math.BigDecimal minPrice,

            @Parameter(description = "Maximum price")
            @RequestParam(required = false) java.math.BigDecimal maxPrice,

            @Parameter(description = "Limit to a specific restaurant")
            @RequestParam(required = false) Long restaurantId,

            @Parameter(description = "Limit to a specific category")
            @RequestParam(required = false) Long categoryId,

            @Parameter(description = "Sort field: rating | price | name")
            @RequestParam(required = false, defaultValue = "rating") String sortBy,

            @Parameter(description = "Sort direction: asc | desc")
            @RequestParam(required = false, defaultValue = "desc") String direction,

            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {

        MenuItemFilter filter = new MenuItemFilter();
        filter.setKeyword(keyword);
        filter.setVegOnly(vegOnly);
        filter.setMinRating(minRating);
        filter.setMinPrice(minPrice);
        filter.setMaxPrice(maxPrice);
        filter.setRestaurantId(restaurantId);
        filter.setCategoryId(categoryId);
        filter.setSortBy(sortBy);
        filter.setDirection(direction);
        filter.setPage(page);
        filter.setSize(size);

        return ApiResponse.ok(searchService.searchMenuItems(filter));
    }

    // ── Unified Multi-field Search ─────────────────────────────────────────────

    @Operation(
        summary     = "Unified multi-field search",
        description = "Perform a multi-field search across restaurants, cuisines, and menu items."
    )
    @GetMapping("/all")
    public ApiResponse<UnifiedSearchResponse> unifiedSearch(
            @Parameter(description = "Query string matching restaurants and menu items")
            @RequestParam String keyword,

            @Parameter(description = "Optional caller latitude")
            @RequestParam(required = false) Double lat,

            @Parameter(description = "Optional caller longitude")
            @RequestParam(required = false) Double lng) {

        return ApiResponse.ok(searchService.unifiedSearch(keyword, lat, lng));
    }

    // ── Autocomplete Suggestions ──────────────────────────────────────────────

    @Operation(
        summary     = "Autocomplete suggestions",
        description = "Return instant matching names as suggestions while typing."
    )
    @GetMapping("/autocomplete")
    public ApiResponse<List<String>> autocomplete(
            @Parameter(description = "Keyword query prefix")
            @RequestParam String keyword) {

        return ApiResponse.ok(searchService.autocomplete(keyword));
    }

    // ── Search Suggestions / Trending Keywords ─────────────────────────────────

    @Operation(
        summary     = "Get popular trending keywords",
        description = "Retrieve list of popular searched keywords."
    )
    @GetMapping("/suggestions/popular")
    public ApiResponse<List<String>> getPopularSuggestions() {
        return ApiResponse.ok(searchAnalyticsService.getPopularSuggestions());
    }

    // ── Conversion Tracker ─────────────────────────────────────────────────────

    @Operation(
        summary     = "Log search conversion",
        description = "Track which searched keywords successfully led to checkout conversions."
    )
    @PostMapping("/analytics/conversion")
    public ApiResponse<String> trackConversion(
            @Parameter(description = "Keyword to record checkout conversion for")
            @RequestParam String keyword) {

        searchAnalyticsService.recordConversion(keyword);
        return ApiResponse.ok("Conversion tracked successfully");
    }

    // ── Search Analytics Reports (Admin) ───────────────────────────────────────

    @Operation(
        summary     = "Retrieve search analytics",
        description = "Retrieve reports containing keyword search counts, result counts, and conversion rates (Admin only)."
    )
    @GetMapping("/analytics")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<List<SearchAnalytics>> getAnalyticsReport() {
        return ApiResponse.ok(searchAnalyticsService.getAnalyticsReport());
    }

    // ── Manual Reindexing Support (Admin) ──────────────────────────────────────

    @Operation(
        summary     = "Reindex all database records",
        description = "Clears and re-builds Elasticsearch indexes from SQL database entries (Admin only)."
    )
    @PostMapping("/reindex")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<String> reindexAll() {
        searchIndexService.reindexAll();
        return ApiResponse.ok("Reindexing completed successfully");
    }
}
