package com.eets.dto.response;

import java.util.List;
public record MenuResponse(List<CategoryWithItems> categories) {
    public record CategoryWithItems(MenuCategoryResponse category, List<MenuItemResponse> items) {}
}
