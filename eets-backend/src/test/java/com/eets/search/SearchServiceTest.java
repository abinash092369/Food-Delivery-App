package com.eets.search;

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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SearchServiceTest {

    @Mock private RestaurantRepository restaurantRepository;
    @Mock private MenuItemRepository menuItemRepository;
    @Mock private RestaurantService restaurantService;
    @Mock private MenuService menuService;
    @Mock private SearchAnalyticsService searchAnalyticsService;
    @Mock private ElasticsearchOperations elasticsearchOperations;

    @InjectMocks
    private SearchService searchService;

    private Restaurant r1;
    private Restaurant r2;
    private RestaurantCardResponse card1;
    private RestaurantCardResponse card2;

    @BeforeEach
    void setUp() {
        r1 = new Restaurant();
        r1.setId(1L);
        r1.setName("Pizza Place");

        r2 = new Restaurant();
        r2.setId(2L);
        r2.setName("Burger Joint");

        card1 = new RestaurantCardResponse(
                1L, "Pizza Place", "pizza-place", "pizza.jpg",
                List.of("Italian"), 4.5, 100, 30,
                BigDecimal.valueOf(20.0), BigDecimal.valueOf(100.0),
                true, 5.0
        );

        card2 = new RestaurantCardResponse(
                2L, "Burger Joint", "burger-joint", "burger.jpg",
                List.of("American"), 4.2, 80, 25,
                BigDecimal.valueOf(15.0), BigDecimal.valueOf(50.0),
                true, 15.0
        );
    }

    @Test
    @DisplayName("searchRestaurants() - happy path using Elasticsearch and DB hydration")
    void searchRestaurants_happyPath() {
        RestaurantFilter filter = new RestaurantFilter();
        filter.setKeyword("pizza");
        filter.setPage(0);
        filter.setSize(10);

        // Mock Elasticsearch search hits
        SearchHits<RestaurantDocument> mockHits = mock(SearchHits.class);
        SearchHit<RestaurantDocument> hit1 = mock(SearchHit.class);
        SearchHit<RestaurantDocument> hit2 = mock(SearchHit.class);

        RestaurantDocument doc1 = RestaurantDocument.builder().id(1L).build();
        RestaurantDocument doc2 = RestaurantDocument.builder().id(2L).build();

        when(hit1.getContent()).thenReturn(doc1);
        when(hit2.getContent()).thenReturn(doc2);
        when(mockHits.stream()).thenReturn(List.of(hit1, hit2).stream());
        when(mockHits.getTotalHits()).thenReturn(2L);

        when(elasticsearchOperations.search(any(NativeQuery.class), eq(RestaurantDocument.class)))
                .thenReturn(mockHits);

        // Mock SQL database hydration
        when(restaurantRepository.findAllById(List.of(1L, 2L))).thenReturn(List.of(r1, r2));

        // Mock mappings
        when(restaurantService.toCard(r1, null, null)).thenReturn(card1);
        when(restaurantService.toCard(r2, null, null)).thenReturn(card2);

        // Execute search
        PageResponse<RestaurantCardResponse> response = searchService.searchRestaurants(filter);

        // Verify result assertions
        assertThat(response.content()).hasSize(2);
        assertThat(response.content().get(0).id()).isEqualTo(1L);
        assertThat(response.content().get(1).id()).isEqualTo(2L);

        // Verify analytics were logged
        verify(searchAnalyticsService).recordSearch("pizza", 2);
        verify(restaurantRepository).findAllById(List.of(1L, 2L));
        verify(restaurantService).toCard(r1, null, null);
        verify(restaurantService).toCard(r2, null, null);
    }

    @Test
    @DisplayName("searchMenuItems() - happy path using Elasticsearch and DB hydration")
    void searchMenuItems_happyPath() {
        MenuItemFilter filter = new MenuItemFilter();
        filter.setKeyword("burger");
        filter.setPage(0);
        filter.setSize(10);

        MenuItem item1 = new MenuItem();
        item1.setId(10L);

        MenuItemResponse responseDto = new MenuItemResponse(
                10L, 1L, "Burger", "Juicy",
                BigDecimal.valueOf(150.0), "burger.jpg", false, true, false,
                4.5, List.of()
        );

        // Mock Elasticsearch search hits
        SearchHits<MenuItemDocument> mockHits = mock(SearchHits.class);
        SearchHit<MenuItemDocument> hit1 = mock(SearchHit.class);
        MenuItemDocument doc1 = MenuItemDocument.builder().id(10L).build();

        when(hit1.getContent()).thenReturn(doc1);
        when(mockHits.stream()).thenReturn(List.of(hit1).stream());
        when(mockHits.getTotalHits()).thenReturn(1L);

        when(elasticsearchOperations.search(any(NativeQuery.class), eq(MenuItemDocument.class)))
                .thenReturn(mockHits);

        // Mock SQL database hydration
        when(menuItemRepository.findAllById(List.of(10L))).thenReturn(List.of(item1));

        // Mock mappings
        when(menuService.toItem(item1)).thenReturn(responseDto);

        // Execute search
        PageResponse<MenuItemResponse> response = searchService.searchMenuItems(filter);

        // Verify result assertions
        assertThat(response.content()).hasSize(1);
        assertThat(response.content().get(0).id()).isEqualTo(10L);

        // Verify dependencies
        verify(searchAnalyticsService).recordSearch("burger", 1);
        verify(menuItemRepository).findAllById(List.of(10L));
        verify(menuService).toItem(item1);
    }

    @Test
    @DisplayName("unifiedSearch() - combines restaurant and menu items results")
    void unifiedSearch_combinesResults() {
        // Mock Restaurant search
        SearchHits<RestaurantDocument> rMockHits = mock(SearchHits.class);
        SearchHit<RestaurantDocument> rHit = mock(SearchHit.class);
        RestaurantDocument rDoc = RestaurantDocument.builder().id(1L).build();
        when(rHit.getContent()).thenReturn(rDoc);
        when(rMockHits.stream()).thenReturn(List.of(rHit).stream());
        when(rMockHits.getTotalHits()).thenReturn(1L);

        when(elasticsearchOperations.search(any(NativeQuery.class), eq(RestaurantDocument.class)))
                .thenReturn(rMockHits);
        when(restaurantRepository.findAllById(List.of(1L))).thenReturn(List.of(r1));
        when(restaurantService.toCard(r1, 12.0, 77.0)).thenReturn(card1);

        // Mock MenuItem search
        SearchHits<MenuItemDocument> mMockHits = mock(SearchHits.class);
        SearchHit<MenuItemDocument> mHit = mock(SearchHit.class);
        MenuItemDocument mDoc = MenuItemDocument.builder().id(10L).build();
        when(mHit.getContent()).thenReturn(mDoc);
        when(mMockHits.stream()).thenReturn(List.of(mHit).stream());
        when(mMockHits.getTotalHits()).thenReturn(1L);

        when(elasticsearchOperations.search(any(NativeQuery.class), eq(MenuItemDocument.class)))
                .thenReturn(mMockHits);
        MenuItem item1 = new MenuItem();
        item1.setId(10L);
        when(menuItemRepository.findAllById(List.of(10L))).thenReturn(List.of(item1));

        MenuItemResponse responseDto = new MenuItemResponse(
                10L, 1L, "Burger", "Juicy",
                BigDecimal.valueOf(150.0), "burger.jpg", false, true, false,
                4.5, List.of()
        );
        when(menuService.toItem(item1)).thenReturn(responseDto);

        // Execute unified search
        UnifiedSearchResponse response = searchService.unifiedSearch("pizza", 12.0, 77.0);

        // Verify result assertions
        assertThat(response.restaurants()).hasSize(1);
        assertThat(response.restaurants().get(0).id()).isEqualTo(1L);
        assertThat(response.menuItems()).hasSize(1);
        assertThat(response.menuItems().get(0).id()).isEqualTo(10L);
    }

    @Test
    @DisplayName("autocomplete() - returns suggestions from restaurants and menu items matching prefix")
    void autocomplete_returnsSuggestions() {
        // Mock Restaurant Autocomplete
        SearchHits<RestaurantDocument> rMockHits = mock(SearchHits.class);
        SearchHit<RestaurantDocument> rHit = mock(SearchHit.class);
        RestaurantDocument rDoc = RestaurantDocument.builder().id(1L).name("Pizza Palace").build();
        when(rHit.getContent()).thenReturn(rDoc);
        when(rMockHits.iterator()).thenReturn(List.of(rHit).iterator());
        when(elasticsearchOperations.search(any(NativeQuery.class), eq(RestaurantDocument.class)))
                .thenReturn(rMockHits);

        // Mock MenuItem Autocomplete
        SearchHits<MenuItemDocument> mMockHits = mock(SearchHits.class);
        SearchHit<MenuItemDocument> mHit = mock(SearchHit.class);
        MenuItemDocument mDoc = MenuItemDocument.builder().id(10L).name("Pizza Margherita").build();
        when(mHit.getContent()).thenReturn(mDoc);
        when(mMockHits.iterator()).thenReturn(List.of(mHit).iterator());
        when(elasticsearchOperations.search(any(NativeQuery.class), eq(MenuItemDocument.class)))
                .thenReturn(mMockHits);

        // Execute
        List<String> suggestions = searchService.autocomplete("Piz");

        // Assertions
        assertThat(suggestions).containsExactly("Pizza Palace", "Pizza Margherita");
    }
}
