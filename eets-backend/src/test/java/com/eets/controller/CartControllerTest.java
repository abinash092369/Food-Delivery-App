package com.eets.controller;

import com.eets.dto.request.AddToCartRequest;
import com.eets.dto.response.CartResponse;
import com.eets.security.JwtAuthenticationFilter;
import com.eets.security.JwtTokenProvider;
import com.eets.security.RateLimitingFilter;
import com.eets.service.CartService;
import com.eets.config.SecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CartController.class)
@Import(SecurityConfig.class)
class CartControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private CartService cartService;
    @MockBean private JwtTokenProvider jwtTokenProvider;
    @MockBean private JwtAuthenticationFilter jwtAuthenticationFilter;
    @MockBean private RateLimitingFilter rateLimitingFilter;
    @MockBean private StringRedisTemplate stringRedisTemplate;

    @BeforeEach
    void setUpFilters() throws Exception {
        doAnswer(invocation -> {
            jakarta.servlet.ServletRequest req = invocation.getArgument(0);
            jakarta.servlet.ServletResponse res = invocation.getArgument(1);
            jakarta.servlet.FilterChain chain = invocation.getArgument(2);
            chain.doFilter(req, res);
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(), any(), any());

        doAnswer(invocation -> {
            jakarta.servlet.ServletRequest req = invocation.getArgument(0);
            jakarta.servlet.ServletResponse res = invocation.getArgument(1);
            jakarta.servlet.FilterChain chain = invocation.getArgument(2);
            chain.doFilter(req, res);
            return null;
        }).when(rateLimitingFilter).doFilter(any(), any(), any());
    }

    private UsernamePasswordAuthenticationToken customerAuth() {
        return new UsernamePasswordAuthenticationToken(1L, null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")));
    }

    @Test
    @DisplayName("get() - 200 happy path (authenticated)")
    void get_happyPath() throws Exception {
        CartResponse response = new CartResponse(10L, 50L, "Pizza Place", Collections.emptyList(), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, null);

        when(cartService.getCart(eq(1L))).thenReturn(response);

        mockMvc.perform(get("/api/cart")
                .with(authentication(customerAuth()))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("add() - 400 on invalid input")
    void add_invalidInput() throws Exception {
        // null menuItemId and negative/zero quantity should trigger validation errors
        AddToCartRequest req = new AddToCartRequest(null, 0, Collections.emptyList());

        mockMvc.perform(post("/api/cart/items")
                .with(authentication(customerAuth()))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("get() - 401 on missing token (unauthenticated)")
    void get_unauthenticated() throws Exception {
        mockMvc.perform(get("/api/cart")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }
}
