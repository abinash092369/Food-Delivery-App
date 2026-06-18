package com.eets.service;

import com.eets.config.CacheConstants;
import com.eets.domain.*;
import com.eets.dto.response.*;
import com.eets.exception.ResourceNotFoundException;
import com.eets.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuCategoryRepository categories;
    private final MenuItemRepository items;
    private final MenuCustomizationGroupRepository groups;
    private final MenuCustomizationOptionRepository options;

    @Cacheable(value = CacheConstants.MENU_DETAILS, key = "#restaurantId")
    public MenuResponse fullMenu(Long restaurantId) {
        List<MenuCategory> cats = categories.findByRestaurantIdOrderBySortOrderAsc(restaurantId);
        List<MenuResponse.CategoryWithItems> result = new ArrayList<>();
        for (MenuCategory c : cats) {
            List<MenuItem> its = items.findByCategoryId(c.getId());
            List<MenuItemResponse> mapped = its.stream().map(this::toItem).toList();
            result.add(new MenuResponse.CategoryWithItems(toCat(c), mapped));
        }
        return new MenuResponse(result);
    }

    @Cacheable(value = CacheConstants.MENU_ITEMS, key = "#id")
    public MenuItemResponse getItem(Long id) {
        MenuItem mi = items.findById(id).orElseThrow(() -> new ResourceNotFoundException("Item not found"));
        return toItem(mi);
    }

    public MenuItemResponse toItem(MenuItem mi) {
        List<MenuCustomizationGroup> grps = groups.findByMenuItemIdOrderBySortOrderAsc(mi.getId());
        List<CustomizationGroupResponse> grpDtos = grps.stream().map(g -> {
            List<MenuCustomizationOption> opts = options.findByGroupIdOrderBySortOrderAsc(g.getId());
            List<CustomizationOptionResponse> oDtos = opts.stream()
                .map(o -> new CustomizationOptionResponse(o.getId(), o.getName(), o.getExtraPrice())).toList();
            return new CustomizationGroupResponse(g.getId(), g.getName(), g.getType(), g.getIsRequired(), oDtos);
        }).toList();
        return new MenuItemResponse(mi.getId(), mi.getCategoryId(), mi.getName(), mi.getDescription(),
            mi.getPrice(), mi.getImageUrl(), mi.getIsVeg(), mi.getIsAvailable(), mi.getIsFeatured(),
            mi.getAvgRating(), grpDtos);
    }

    public MenuCategoryResponse toCat(MenuCategory c) {
        return new MenuCategoryResponse(c.getId(), c.getName(), c.getDescription(), c.getImageUrl(),
            c.getSortOrder(), c.getIsAvailable());
    }
}
