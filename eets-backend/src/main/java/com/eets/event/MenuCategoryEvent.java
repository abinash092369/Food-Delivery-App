package com.eets.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MenuCategoryEvent {
    public enum Action { SAVE, DELETE }
    private final Long id;
    private final Action action;
}
