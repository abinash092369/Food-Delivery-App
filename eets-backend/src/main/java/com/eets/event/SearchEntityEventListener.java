package com.eets.event;

import com.eets.service.SearchIndexService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class SearchEntityEventListener {

    private final SearchIndexService searchIndexService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleRestaurantEvent(RestaurantEvent event) {
        try {
            log.info("Handling RestaurantEvent for id={} action={}", event.getId(), event.getAction());
            if (event.getAction() == RestaurantEvent.Action.SAVE) {
                searchIndexService.indexRestaurant(event.getId());
            } else {
                searchIndexService.deleteRestaurant(event.getId());
            }
        } catch (Exception e) {
            log.warn("Failed to handle RestaurantEvent for id={}: {}", event.getId(), e.getMessage());
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleMenuItemEvent(MenuItemEvent event) {
        try {
            log.info("Handling MenuItemEvent for id={} action={}", event.getId(), event.getAction());
            if (event.getAction() == MenuItemEvent.Action.SAVE) {
                searchIndexService.indexMenuItem(event.getId());
            } else {
                searchIndexService.deleteMenuItem(event.getId());
            }
        } catch (Exception e) {
            log.warn("Failed to handle MenuItemEvent for id={}: {}", event.getId(), e.getMessage());
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleCategoryEvent(MenuCategoryEvent event) {
        try {
            log.info("Handling MenuCategoryEvent for id={} action={}", event.getId(), event.getAction());
            if (event.getAction() == MenuCategoryEvent.Action.SAVE) {
                searchIndexService.indexCategory(event.getId());
            } else {
                searchIndexService.deleteCategory(event.getId());
            }
        } catch (Exception e) {
            log.warn("Failed to handle MenuCategoryEvent for id={}: {}", event.getId(), e.getMessage());
        }
    }
}
