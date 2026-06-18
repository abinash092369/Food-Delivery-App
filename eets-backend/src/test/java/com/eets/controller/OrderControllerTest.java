package com.eets.controller;

import com.eets.domain.PaymentMethod;
import com.eets.dto.request.InitiateOrderRequest;
import com.eets.dto.response.InitiateOrderResponse;
import com.eets.security.JwtAuthenticationFilter;
import com.eets.security.JwtTokenProvider;
import com.eets.security.RateLimitingFilter;
import com.eets.service.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrderController.class)
class OrderControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private OrderService orderService;
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
    @DisplayName("initiate() - 200 happy path (authenticated)")
    void initiate_happyPath() throws Exception {
        InitiateOrderRequest req = new InitiateOrderRequest(10L, PaymentMethod.COD, null, null);
        InitiateOrderResponse response = new InitiateOrderResponse(500L, "ORD-12345", null, BigDecimal.valueOf(100.0), "INR", null, null);

        when(orderService.initiate(eq(1L), any(InitiateOrderRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/orders/initiate")
                .with(authentication(customerAuth()))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("initiate() - 400 on invalid input")
    void initiate_invalidInput() throws Exception {
        // null addressId and paymentMethod should trigger validation errors
        InitiateOrderRequest req = new InitiateOrderRequest(null, null, null, null);

        mockMvc.perform(post("/api/orders/initiate")
                .with(authentication(customerAuth()))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("list() - 401 on missing token (unauthenticated)")
    void list_unauthenticated() throws Exception {
        mockMvc.perform(get("/api/orders")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }
}
