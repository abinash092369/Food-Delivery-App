package com.eets.event;

import com.eets.domain.MenuItem;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostRemove;
import jakarta.persistence.PostUpdate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
public class MenuItemEntityListener {

    private static ApplicationEventPublisher publisher;

    @Autowired
    public void setPublisher(ApplicationEventPublisher publisher) {
        MenuItemEntityListener.publisher = publisher;
    }

    @PostPersist
    @PostUpdate
    public void onPostSave(MenuItem mi) {
        if (publisher != null) {
            publisher.publishEvent(new MenuItemEvent(mi.getId(), mi.getRestaurantId(), MenuItemEvent.Action.SAVE));
        }
    }

    @PostRemove
    public void onPostRemove(MenuItem mi) {
        if (publisher != null) {
            publisher.publishEvent(new MenuItemEvent(mi.getId(), mi.getRestaurantId(), MenuItemEvent.Action.DELETE));
        }
    }
}
