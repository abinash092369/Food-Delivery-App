package com.eets.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final StringRedisTemplate redis;
    private final com.eets.repository.UserRepository userRepository;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, StringRedisTemplate redis,
            com.eets.repository.UserRepository userRepository) {
        this.tokenProvider = tokenProvider;
        this.redis = redis;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String header = req.getHeader(SecurityConstants.HEADER);
        if (header != null && header.startsWith(SecurityConstants.PREFIX)) {
            String token = header.substring(SecurityConstants.PREFIX.length());
            try {
                if (tokenProvider.validate(token) && !isBlacklisted(token)) {
                    var claims = tokenProvider.parse(token);
                    Long userId = Long.valueOf(claims.getSubject());

                    // Check user ban status in real-time
                    boolean isBanned = userRepository.findById(userId)
                            .map(u -> Boolean.TRUE.equals(u.getIsBanned()))
                            .orElse(false);

                    if (!isBanned) {
                        String role = (String) claims.get("role");
                        var auth = new UsernamePasswordAuthenticationToken(
                                userId, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                }
            } catch (Exception ignored) {
            }
        }
        chain.doFilter(req, res);
    }

    private boolean isBlacklisted(String token) {
        try {
            return Boolean.TRUE.equals(redis.hasKey("blacklist:" + token));
        } catch (Exception e) {
            return false;
        }
    }
}