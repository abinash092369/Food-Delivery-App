package com.eets.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.eets.dto.response.EtaPayload;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OrderSocketService {
    private final SimpMessagingTemplate messaging;

    public void broadcastOrderToRestaurant(Long restaurantId, Object payload) {
        messaging.convertAndSend("/topic/restaurant/" + restaurantId, payload);
    }
    public void broadcastStatusUpdate(Long orderId, Object payload) {
        messaging.convertAndSend("/topic/order/" + orderId, payload);
    }
    public void notifyUser(Long userId, Object payload) {
        messaging.convertAndSendToUser(String.valueOf(userId), "/queue/notifications", payload);
    }
    public void notifyDriverLocation(Long orderId, double lat, double lng, Integer etaMin) {
        messaging.convertAndSend("/topic/order/" + orderId,
            Map.of("event", "driver_location", "lat", lat, "lng", lng, "eta", etaMin == null ? 0 : etaMin));
    }

    public void broadcastEta(Long orderId, EtaPayload payload) {
        messaging.convertAndSend("/topic/orders/" + orderId + "/eta", payload);
    }
}
