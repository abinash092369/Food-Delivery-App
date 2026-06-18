package com.eets.security;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider tokenProvider;

    public JwtChannelInterceptor(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                if (tokenProvider.validate(token)) {
                    var claims = tokenProvider.parse(token);
                    Long userId = Long.valueOf(claims.getSubject());
                    String role = (String) claims.get("role");
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            userId, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                    accessor.setUser(auth);
                } else {
                    throw new IllegalArgumentException("Invalid token");
                }
            } else {
                throw new IllegalArgumentException("No token found");
            }
        }
        return message;
    }
}
