package com.eets.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DriverSocketService {
    private final SimpMessagingTemplate messaging;

    public void sendAssignmentToDriver(Long driverId, Object payload) {
        messaging.convertAndSend("/topic/driver/" + driverId, payload);
    }
}
