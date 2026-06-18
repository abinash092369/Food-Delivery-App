package com.eets.search;

import com.eets.config.CacheConstants;
import com.eets.document.MenuItemDocument;
import com.eets.document.RestaurantDocument;
import com.eets.domain.MenuItem;
import com.eets.domain.Restaurant;
import com.eets.dto.response.MenuItemResponse;
import com.eets.dto.response.RestaurantCardResponse;
import com.eets.dto.response.UnifiedSearchResponse;
import com.eets.repository.MenuItemRepository;
import com.eets.repository.RestaurantRepository;
import com.eets.service.MenuService;
import com.eets.service.RestaurantService;
import com.eets.service.SearchAnalyticsService;
import com.eets.util.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.client.elc.NativeQueryBuilder;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;

import co.elastic.clients.elasticsearch._types.SortOrder;
import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.FieldValueFactorModifier;
import co.elastic.clients.elasticsearch._types.query_dsl.FunctionScore;
import co.elastic.clients.elasticsearch._types.query_dsl.FunctionScoreMode;
import co.elastic.clients.elasticsearch._types.query_dsl.FunctionBoostMode;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.json.JsonData;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchService {

    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final RestaurantService restaurantService;
    private final MenuService menuService;
    private final SearchAnalyticsService searchAnalyticsService;
    private final ElasticsearchOperations elasticsearchOperations;

    // ── Restaurants ───────────────────────────────────────────────────────────

    @Cacheable(value = CacheConstants.SEARCH_RESULTS)
    public PageResponse<RestaurantCardResponse> searchRestaurants(RestaurantFilter filter) {
        BoolQuery.Builder boolQuery = new BoolQuery.Builder();

        // Enforce approved and active restaurants
        boolQuery.must(q -> q.term(t -> t.field("isApproved").value(true)));
        boolQuery.must(q -> q.term(t -> t.field("isActive").value(true)));

        // Keyword filter: search across name, description, and cuisineTypes with fuzzy and prefix matching
        if (hasText(filter.getKeyword())) {
            String kw = filter.getKeyword();
            boolQuery.must(q -> q.bool(b -> b
                .should(s -> s.match(m -> m.field("name").query(kw).fuzziness("AUTO")))
                .should(s -> s.matchPhrasePrefix(mpp -> mpp.field("name").query(kw)))
                .should(s -> s.match(m -> m.field("description").query(kw).fuzziness("AUTO")))
                .should(s -> s.match(m -> m.field("cuisineTypes").query(kw).fuzziness("AUTO")))
                .minimumShouldMatch("1")
            ));
        }

        // Cuisine filter
        if (hasText(filter.getCuisine())) {
            boolQuery.filter(f -> f.match(m -> m.field("cuisineTypes").query(filter.getCuisine())));
        }

        // vegOnly filter
        if (Boolean.TRUE.equals(filter.getVegOnly())) {
            boolQuery.filter(f -> f.term(t -> t.field("hasVeg").value(true)));
        }

        // minRating filter
        if (filter.getMinRating() != null) {
            boolQuery.filter(f -> f.range(r -> r.field("avgRating").gte(JsonData.of(filter.getMinRating()))));
        }

        // maxDeliveryTime filter
        if (filter.getMaxDeliveryTime() != null) {
            boolQuery.filter(f -> f.range(r -> r.field("deliveryTimeMin").lte(JsonData.of(filter.getMaxDeliveryTime()))));
        }

        // Price range (delivery fee) filter
        if (filter.getMinPrice() != null) {
            boolQuery.filter(f -> f.range(r -> r.field("deliveryFee").gte(JsonData.of(filter.getMinPrice().doubleValue()))));
        }
        if (filter.getMaxPrice() != null) {
            boolQuery.filter(f -> f.range(r -> r.field("deliveryFee").lte(JsonData.of(filter.getMaxPrice().doubleValue()))));
        }

        NativeQueryBuilder nqb = NativeQuery.builder();

        // ── Custom Restaurant Ranking ──
        // If no sort is requested, we rank using function_score (avgRating, totalRatings, totalOrders)
        if (filter.getSortBy() == null || "rating".equalsIgnoreCase(filter.getSortBy()) || "popularity".equalsIgnoreCase(filter.getSortBy())) {
            Query scoreQuery = Query.of(q -> q
                .functionScore(fs -> fs
                    .query(Query.of(qq -> qq.bool(boolQuery.build())))
                    .functions(
                        FunctionScore.of(f -> f.fieldValueFactor(fv -> fv.field("avgRating").factor(2.0).modifier(FieldValueFactorModifier.None).missing(1.0))),
                        FunctionScore.of(f -> f.fieldValueFactor(fv -> fv.field("totalRatings").factor(1.0).modifier(FieldValueFactorModifier.Log1p).missing(0.0))),
                        FunctionScore.of(f -> f.fieldValueFactor(fv -> fv.field("totalOrders").factor(1.5).modifier(FieldValueFactorModifier.Log1p).missing(0.0)))
                    )
                    .scoreMode(FunctionScoreMode.Multiply)
                    .boostMode(FunctionBoostMode.Multiply)
                )
            );
            nqb.withQuery(scoreQuery);
        } else {
            nqb.withQuery(Query.of(qq -> qq.bool(boolQuery.build())));
        }

        // ── Sorting ──
        if ("distance".equalsIgnoreCase(filter.getSortBy()) && filter.getLat() != null && filter.getLng() != null) {
            nqb.withSort(s -> s.geoDistance(gd -> gd
                .field("location")
                .location(l -> l.latlon(ll -> ll.lat(filter.getLat()).lon(filter.getLng())))
                .order(SortOrder.Asc)
            ));
        } else if ("deliveryTime".equalsIgnoreCase(filter.getSortBy())) {
            SortOrder order = "desc".equalsIgnoreCase(filter.getDirection()) ? SortOrder.Desc : SortOrder.Asc;
            nqb.withSort(s -> s.field(f -> f.field("deliveryTimeMin").order(order)));
        } else if ("price".equalsIgnoreCase(filter.getSortBy())) {
            SortOrder order = "desc".equalsIgnoreCase(filter.getDirection()) ? SortOrder.Desc : SortOrder.Asc;
            nqb.withSort(s -> s.field(f -> f.field("deliveryFee").order(order)));
        } else if ("rating".equalsIgnoreCase(filter.getSortBy())) {
            SortOrder order = "asc".equalsIgnoreCase(filter.getDirection()) ? SortOrder.Asc : SortOrder.Desc;
            nqb.withSort(s -> s.field(f -> f.field("avgRating").order(order)));
        }

        nqb.withPageable(PageRequest.of(filter.getPage(), filter.getSize()));

        SearchHits<RestaurantDocument> hits = elasticsearchOperations.search(nqb.build(), RestaurantDocument.class);

        // Record Search Analytics
        if (hasText(filter.getKeyword())) {
            searchAnalyticsService.recordSearch(filter.getKeyword(), (int) hits.getTotalHits());
        }

        // Hydrate results from MySQL DB to preserve order and dynamic properties
        List<Long> ids = hits.stream().map(h -> h.getContent().getId()).toList();
        List<Restaurant> dbRestaurants = restaurantRepository.findAllById(ids);
        Map<Long, Restaurant> map = dbRestaurants.stream().collect(Collectors.toMap(Restaurant::getId, r -> r));

        List<RestaurantCardResponse> content = ids.stream()
                .map(map::get)
                .filter(Objects::nonNull)
                .map(r -> restaurantService.toCard(r, filter.getLat(), filter.getLng()))
                .toList();

        long totalHits = hits.getTotalHits();
        int totalPages = (int) Math.ceil((double) totalHits / filter.getSize());

        return new PageResponse<>(content, filter.getPage(), filter.getSize(), totalHits, totalPages, filter.getPage() >= totalPages - 1);
    }

    // ── Menu Items ────────────────────────────────────────────────────────────

    @Cacheable(value = CacheConstants.SEARCH_RESULTS)
    public PageResponse<MenuItemResponse> searchMenuItems(MenuItemFilter filter) {
        BoolQuery.Builder boolQuery = new BuilderBoolQuery();

        // Only show available items
        boolQuery.must(q -> q.term(t -> t.field("isAvailable").value(true)));

        // Keyword filter: search name, description, tags
        if (hasText(filter.getKeyword())) {
            String kw = filter.getKeyword();
            boolQuery.must(q -> q.bool(b -> b
                .should(s -> s.match(m -> m.field("name").query(kw).fuzziness("AUTO")))
                .should(s -> s.matchPhrasePrefix(mpp -> mpp.field("name").query(kw)))
                .should(s -> s.match(m -> m.field("description").query(kw).fuzziness("AUTO")))
                .should(s -> s.match(m -> m.field("tags").query(kw).fuzziness("AUTO")))
                .minimumShouldMatch("1")
            ));
        }

        // vegOnly filter
        if (Boolean.TRUE.equals(filter.getVegOnly())) {
            boolQuery.filter(f -> f.term(t -> t.field("isVeg").value(true)));
        }

        // minRating filter
        if (filter.getMinRating() != null) {
            boolQuery.filter(f -> f.range(r -> r.field("avgRating").gte(JsonData.of(filter.getMinRating()))));
        }

        // Price range filters
        if (filter.getMinPrice() != null) {
            boolQuery.filter(f -> f.range(r -> r.field("price").gte(JsonData.of(filter.getMinPrice().doubleValue()))));
        }
        if (filter.getMaxPrice() != null) {
            boolQuery.filter(f -> f.range(r -> r.field("price").lte(JsonData.of(filter.getMaxPrice().doubleValue()))));
        }

        // Restaurant scope
        if (filter.getRestaurantId() != null) {
            boolQuery.filter(f -> f.term(t -> t.field("restaurantId").value(filter.getRestaurantId())));
        }

        // Category scope
        if (filter.getCategoryId() != null) {
            boolQuery.filter(f -> f.term(t -> t.field("categoryId").value(filter.getCategoryId())));
        }

        NativeQueryBuilder nqb = NativeQuery.builder()
                .withQuery(Query.of(q -> q.bool(boolQuery.build())));

        // Sorting
        if ("price".equalsIgnoreCase(filter.getSortBy())) {
            SortOrder order = "desc".equalsIgnoreCase(filter.getDirection()) ? SortOrder.Desc : SortOrder.Asc;
            nqb.withSort(s -> s.field(f -> f.field("price").order(order)));
        } else if ("name".equalsIgnoreCase(filter.getSortBy())) {
            SortOrder order = "desc".equalsIgnoreCase(filter.getDirection()) ? SortOrder.Desc : SortOrder.Asc;
            // Use keyword sub-field for exact keyword sorting
            nqb.withSort(s -> s.field(f -> f.field("name.keyword").order(order).missing("_last")));
        } else {
            SortOrder order = "asc".equalsIgnoreCase(filter.getDirection()) ? SortOrder.Asc : SortOrder.Desc;
            nqb.withSort(s -> s.field(f -> f.field("avgRating").order(order)));
        }

        nqb.withPageable(PageRequest.of(filter.getPage(), filter.getSize()));

        SearchHits<MenuItemDocument> hits = elasticsearchOperations.search(nqb.build(), MenuItemDocument.class);

        // Record Search Analytics
        if (hasText(filter.getKeyword())) {
            searchAnalyticsService.recordSearch(filter.getKeyword(), (int) hits.getTotalHits());
        }

        // Hydrate results
        List<Long> ids = hits.stream().map(h -> h.getContent().getId()).toList();
        List<MenuItem> dbItems = menuItemRepository.findAllById(ids);
        Map<Long, MenuItem> map = dbItems.stream().collect(Collectors.toMap(MenuItem::getId, mi -> mi));

        List<MenuItemResponse> content = ids.stream()
                .map(map::get)
                .filter(Objects::nonNull)
                .map(menuService::toItem)
                .toList();

        long totalHits = hits.getTotalHits();
        int totalPages = (int) Math.ceil((double) totalHits / filter.getSize());

        return new PageResponse<>(content, filter.getPage(), filter.getSize(), totalHits, totalPages, filter.getPage() >= totalPages - 1);
    }

    // ── Unified Search ────────────────────────────────────────────────────────

    public UnifiedSearchResponse unifiedSearch(String keyword, Double lat, Double lng) {
        RestaurantFilter rf = new RestaurantFilter();
        rf.setKeyword(keyword);
        rf.setPage(0);
        rf.setSize(5);
        rf.setLat(lat);
        rf.setLng(lng);
        PageResponse<RestaurantCardResponse> rResp = searchRestaurants(rf);

        MenuItemFilter mf = new MenuItemFilter();
        mf.setKeyword(keyword);
        mf.setPage(0);
        mf.setSize(5);
        PageResponse<MenuItemResponse> mResp = searchMenuItems(mf);

        return new UnifiedSearchResponse(rResp.content(), mResp.content());
    }

    // ── Autocomplete ──────────────────────────────────────────────────────────

    public List<String> autocomplete(String keyword) {
        if (!hasText(keyword)) {
            return List.of();
        }
        String cleanKeyword = keyword.trim().toLowerCase();

        // Match restaurant names prefix
        BoolQuery.Builder b1 = new BoolQuery.Builder();
        b1.must(q -> q.term(t -> t.field("isActive").value(true)));
        b1.must(q -> q.term(t -> t.field("isApproved").value(true)));
        b1.must(q -> q.matchPhrasePrefix(mpp -> mpp.field("name").query(cleanKeyword)));

        NativeQuery q1 = NativeQuery.builder()
                .withQuery(Query.of(q -> q.bool(b1.build())))
                .withPageable(PageRequest.of(0, 5))
                .build();
        SearchHits<RestaurantDocument> rHits = elasticsearchOperations.search(q1, RestaurantDocument.class);

        // Match menu item names prefix
        BoolQuery.Builder b2 = new BoolQuery.Builder();
        b2.must(q -> q.term(t -> t.field("isAvailable").value(true)));
        b2.must(q -> q.matchPhrasePrefix(mpp -> mpp.field("name").query(cleanKeyword)));

        NativeQuery q2 = NativeQuery.builder()
                .withQuery(Query.of(q -> q.bool(b2.build())))
                .withPageable(PageRequest.of(0, 5))
                .build();
        SearchHits<MenuItemDocument> mHits = elasticsearchOperations.search(q2, MenuItemDocument.class);

        Set<String> suggestions = new LinkedHashSet<>();
        for (var hit : rHits) {
            suggestions.add(hit.getContent().getName());
        }
        for (var hit : mHits) {
            suggestions.add(hit.getContent().getName());
        }

        return suggestions.stream().toList();
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }

    private static class BuilderBoolQuery extends BoolQuery.Builder {}
}
