package com.eets.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminSocketService {
    private final SimpMessagingTemplate messaging;

    public void broadcastNewOrder(Object payload) { messaging.convertAndSend("/topic/admin/orders", payload); }
    public void broadcastMetrics(Object payload) { messaging.convertAndSend("/topic/admin/metrics", payload); }
    public void broadcastDriverStatus(Object payload) { messaging.convertAndSend("/topic/admin/drivers", payload); }
    public void broadcastFraudAlert(Object payload) { messaging.convertAndSend("/topic/admin/fraud", payload); }
}
