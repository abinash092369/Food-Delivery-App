package com.eets.controller;

import com.eets.dto.request.LoginRequest;
import com.eets.dto.request.RegisterRequest;
import com.eets.dto.response.AuthResponse;
import com.eets.dto.response.UserResponse;
import com.eets.security.JwtAuthenticationFilter;
import com.eets.security.JwtTokenProvider;
import com.eets.security.RateLimitingFilter;
import com.eets.domain.Role;
import com.eets.service.AuthService;
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
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private AuthService authService;
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

    @Test
    @DisplayName("register() - 200 happy path")
    void register_happyPath() throws Exception {
        RegisterRequest req = new RegisterRequest("Alice", "alice@gmail.com", "password123", "9876543210");
        UserResponse userResponse = new UserResponse(1L, "Alice", "alice@gmail.com", "9876543210", null, Role.CUSTOMER, true, true, true, Instant.now());
        AuthResponse authResponse = new AuthResponse("mock-jwt-token", userResponse);

        when(authService.register(any())).thenReturn(authResponse);
        when(authService.generateRefreshToken(1L)).thenReturn("mock-refresh-token");

        mockMvc.perform(post("/api/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("eets_refresh"))
                .andExpect(cookie().value("eets_refresh", "mock-refresh-token"));
    }

    @Test
    @DisplayName("register() - 400 on invalid input")
    void register_invalidInput() throws Exception {
        // Empty email and invalid phone should trigger validation errors
        RegisterRequest req = new RegisterRequest("Alice", "", "password123", "invalidphone");

        mockMvc.perform(post("/api/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("login() - 200 happy path")
    void login_happyPath() throws Exception {
        LoginRequest req = new LoginRequest("alice@gmail.com", "password123");
        UserResponse userResponse = new UserResponse(1L, "Alice", "alice@gmail.com", "9876543210", null, Role.CUSTOMER, true, true, true, Instant.now());
        AuthResponse authResponse = new AuthResponse("mock-jwt-token", userResponse);

        when(authService.login(any())).thenReturn(authResponse);
        when(authService.generateRefreshToken(1L)).thenReturn("mock-refresh-token");

        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("eets_refresh"))
                .andExpect(cookie().value("eets_refresh", "mock-refresh-token"));
    }
}
