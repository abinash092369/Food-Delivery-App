package com.eets.event;

import com.eets.domain.Restaurant;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostRemove;
import jakarta.persistence.PostUpdate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
public class RestaurantEntityListener {

    private static ApplicationEventPublisher publisher;

    @Autowired
    public void setPublisher(ApplicationEventPublisher publisher) {
        RestaurantEntityListener.publisher = publisher;
    }

    @PostPersist
    @PostUpdate
    public void onPostSave(Restaurant r) {
        if (publisher != null) {
            publisher.publishEvent(new RestaurantEvent(r.getId(), RestaurantEvent.Action.SAVE));
        }
    }

    @PostRemove
    public void onPostRemove(Restaurant r) {
        if (publisher != null) {
            publisher.publishEvent(new RestaurantEvent(r.getId(), RestaurantEvent.Action.DELETE));
        }
    }
}
