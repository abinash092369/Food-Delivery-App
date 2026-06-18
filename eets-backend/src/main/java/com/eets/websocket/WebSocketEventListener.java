package com.eets.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.*;

@Slf4j
@Component
public class WebSocketEventListener {
    @EventListener
    public void onConnect(SessionConnectedEvent e) { log.debug("WS connected: {}", e.getMessage()); }
    @EventListener
    public void onDisconnect(SessionDisconnectEvent e) { log.debug("WS disconnected: {}", e.getSessionId()); }
}
