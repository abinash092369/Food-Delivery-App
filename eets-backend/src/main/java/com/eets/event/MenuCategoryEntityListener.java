package com.eets.event;

import com.eets.domain.MenuCategory;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostRemove;
import jakarta.persistence.PostUpdate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
public class MenuCategoryEntityListener {

    private static ApplicationEventPublisher publisher;

    @Autowired
    public void setPublisher(ApplicationEventPublisher publisher) {
        MenuCategoryEntityListener.publisher = publisher;
    }

    @PostPersist
    @PostUpdate
    public void onPostSave(MenuCategory c) {
        if (publisher != null) {
            publisher.publishEvent(new MenuCategoryEvent(c.getId(), MenuCategoryEvent.Action.SAVE));
        }
    }

    @PostRemove
    public void onPostRemove(MenuCategory c) {
        if (publisher != null) {
            publisher.publishEvent(new MenuCategoryEvent(c.getId(), MenuCategoryEvent.Action.DELETE));
        }
    }
}
