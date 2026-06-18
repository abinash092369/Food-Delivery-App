package com.eets.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MenuItemEvent {
    public enum Action { SAVE, DELETE }
    private final Long id;
    private final Long restaurantId;
    private final Action action;
}
