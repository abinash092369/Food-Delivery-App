package com.eets.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEvent {
    private String eventId;
    private Long userId;
    private String title;
    private String body;
    private String type;
    private Long referenceId;
    private Instant timestamp;
}
