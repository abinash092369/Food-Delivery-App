package com.eets.auth;

import com.eets.domain.*;
import com.eets.dto.request.*;
import com.eets.dto.response.*;
import com.eets.exception.*;
import com.eets.repository.DeliveryPartnerRepository;
import com.eets.repository.RestaurantRepository;
import com.eets.repository.UserRepository;
import com.eets.security.JwtTokenProvider;
import com.eets.service.AuthService;
import com.eets.service.EmailService;
import com.eets.service.OtpService;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Date;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository users;
    @Mock private PasswordEncoder encoder;
    @Mock private JwtTokenProvider jwt;
    @Mock private EmailService emailService;
    @Mock private OtpService otpService;
    @Mock private StringRedisTemplate redis;
    @Mock private ValueOperations<String, String> valueOperations;
    @Mock private RestaurantRepository restaurants;
    @Mock private DeliveryPartnerRepository drivers;
    @Mock private RestTemplate mockRestTemplate;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        lenient().when(redis.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    @DisplayName("register(): new user -> saved, welcome email sent, token returned")
    void register_newUser() {
        RegisterRequest req = new RegisterRequest("Bob", "bob@gmail.com", "password", "9876543210");
        User user = User.builder().id(2L).name("Bob").email("bob@gmail.com").phone("9876543210").passwordHash("encoded-pass").role(Role.CUSTOMER).isActive(true).build();

        when(users.existsByEmail("bob@gmail.com")).thenReturn(false);
        when(users.existsByPhone("9876543210")).thenReturn(false);
        when(encoder.encode("password")).thenReturn("encoded-pass");
        when(users.save(any(User.class))).thenReturn(user);
        when(jwt.generateAccessToken(eq(2L), eq("bob@gmail.com"), eq(Role.CUSTOMER), isNull(), isNull())).thenReturn("access-token-123");

        AuthResponse resp = authService.register(req);

        assertThat(resp).isNotNull();
        assertThat(resp.accessToken()).isEqualTo("access-token-123");
        verify(users).save(any(User.class));
        verify(emailService).sendWelcomeEmail(user);
    }

    @Test
    @DisplayName("register(): duplicate email -> throws BadRequestException")
    void register_duplicateEmail() {
        RegisterRequest req = new RegisterRequest("Bob", "duplicate@gmail.com", "password", "9876543210");

        when(users.existsByEmail("duplicate@gmail.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Email already registered");
    }

    @Test
    @DisplayName("login(): valid credentials -> token returned, lastLoginAt updated")
    void login_validCredentials() {
        LoginRequest req = new LoginRequest("bob@gmail.com", "password");
        User user = User.builder().id(2L).name("Bob").email("bob@gmail.com").passwordHash("encoded-pass").role(Role.CUSTOMER).isActive(true).build();

        when(users.findByEmail("bob@gmail.com")).thenReturn(Optional.of(user));
        when(encoder.matches("password", "encoded-pass")).thenReturn(true);
        when(jwt.generateAccessToken(eq(2L), eq("bob@gmail.com"), eq(Role.CUSTOMER), isNull(), isNull())).thenReturn("access-token-123");

        AuthResponse resp = authService.login(req);

        assertThat(resp).isNotNull();
        assertThat(resp.accessToken()).isEqualTo("access-token-123");
        verify(users).save(user); // lastLoginAt update saves user
    }

    @Test
    @DisplayName("login(): banned user -> throws UnauthorizedException")
    void login_bannedUser() {
        LoginRequest req = new LoginRequest("banned@gmail.com", "password");
        User user = User.builder().id(3L).email("banned@gmail.com").isBanned(true).banReason("Spamming").build();

        when(users.findByEmail("banned@gmail.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Account banned: Spamming");
    }

    @Test
    @DisplayName("login(): wrong password -> throws BadRequestException")
    void login_wrongPassword() {
        LoginRequest req = new LoginRequest("bob@gmail.com", "wrong-password");
        User user = User.builder().id(2L).email("bob@gmail.com").passwordHash("encoded-pass").build();

        when(users.findByEmail("bob@gmail.com")).thenReturn(Optional.of(user));
        when(encoder.matches("wrong-password", "encoded-pass")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid email or password");
    }

    @Test
    @DisplayName("googleLogin(): new user via Google -> created, welcome email sent")
    void googleLogin_newUser() {
        ReflectionTestUtils.setField(authService, "restTemplate", mockRestTemplate);
        GoogleLoginRequest req = new GoogleLoginRequest("google-id-token-abc");
        String googleResponse = "{\"email\":\"new-google@gmail.com\", \"name\":\"Google User\", \"sub\":\"google-sub-12345\", \"picture\":\"http://pic.url\"}";
        User savedUser = User.builder().id(15L).name("Google User").email("new-google@gmail.com").googleId("google-sub-12345").role(Role.CUSTOMER).build();

        when(mockRestTemplate.getForObject(anyString(), eq(String.class))).thenReturn(googleResponse);
        when(users.findByGoogleId("google-sub-12345")).thenReturn(Optional.empty());
        when(users.findByEmail("new-google@gmail.com")).thenReturn(Optional.empty());
        when(users.save(any(User.class))).thenReturn(savedUser);
        when(jwt.generateAccessToken(eq(15L), eq("new-google@gmail.com"), eq(Role.CUSTOMER), isNull(), isNull())).thenReturn("google-access-token");

        AuthResponse resp = authService.googleLogin(req);

        assertThat(resp).isNotNull();
        assertThat(resp.accessToken()).isEqualTo("google-access-token");
        verify(emailService).sendWelcomeEmail(any(User.class));
    }

    @Test
    @DisplayName("googleLogin(): existing user by email -> googleId linked")
    void googleLogin_existingUserByEmail() {
        ReflectionTestUtils.setField(authService, "restTemplate", mockRestTemplate);
        GoogleLoginRequest req = new GoogleLoginRequest("google-id-token-abc");
        String googleResponse = "{\"email\":\"existing@gmail.com\", \"name\":\"Google User\", \"sub\":\"google-sub-12345\"}";
        User existingUser = User.builder().id(15L).name("Existing User").email("existing@gmail.com").role(Role.CUSTOMER).build();

        when(mockRestTemplate.getForObject(anyString(), eq(String.class))).thenReturn(googleResponse);
        when(users.findByGoogleId("google-sub-12345")).thenReturn(Optional.empty());
        when(users.findByEmail("existing@gmail.com")).thenReturn(Optional.of(existingUser));
        when(jwt.generateAccessToken(eq(15L), eq("existing@gmail.com"), eq(Role.CUSTOMER), isNull(), isNull())).thenReturn("google-access-token");

        AuthResponse resp = authService.googleLogin(req);

        assertThat(resp).isNotNull();
        assertThat(resp.accessToken()).isEqualTo("google-access-token");
        assertThat(existingUser.getGoogleId()).isEqualTo("google-sub-12345");
        verify(users).save(existingUser);
    }

    @Test
    @DisplayName("logout(): token blacklisted in Redis with correct TTL")
    void logout_blacklistsToken() {
        String token = "access-token-to-logout";
        Claims claims = mock(Claims.class);
        Date expiration = new Date(System.currentTimeMillis() + 10000); // Expiry in 10s

        when(jwt.parse(token)).thenReturn(claims);
        when(claims.getExpiration()).thenReturn(expiration);

        authService.logout(token);

        verify(valueOperations).set(eq("blacklist:" + token), eq("1"), any(Duration.class));
    }

    @Test
    @DisplayName("forgotPassword(): existing email -> reset token stored in Redis, email sent")
    void forgotPassword_existingEmail() {
        ForgotPasswordRequest req = new ForgotPasswordRequest("existing@gmail.com");
        User user = User.builder().id(2L).email("existing@gmail.com").build();

        when(users.findByEmail("existing@gmail.com")).thenReturn(Optional.of(user));

        authService.forgotPassword(req);

        verify(valueOperations).set(anyString(), eq("2"), any(Duration.class));
        verify(emailService).sendPasswordResetEmail(eq(user), anyString());
    }

    @Test
    @DisplayName("forgotPassword(): non-existent email -> no exception thrown")
    void forgotPassword_nonExistentEmail() {
        ForgotPasswordRequest req = new ForgotPasswordRequest("unknown@gmail.com");

        when(users.findByEmail("unknown@gmail.com")).thenReturn(Optional.empty());

        authService.forgotPassword(req);

        verify(valueOperations, never()).set(anyString(), anyString(), any(Duration.class));
        verify(emailService, never()).sendPasswordResetEmail(any(), anyString());
    }

    @Test
    @DisplayName("resetPassword(): valid token -> password updated, Redis key deleted")
    void resetPassword_validToken() {
        ResetPasswordRequest req = new ResetPasswordRequest("reset-token-123", "newpassword");
        User user = User.builder().id(2L).email("user@gmail.com").build();

        when(valueOperations.get("pwreset:reset-token-123")).thenReturn("2");
        when(users.findById(2L)).thenReturn(Optional.of(user));
        when(encoder.encode("newpassword")).thenReturn("encoded-newpassword");

        authService.resetPassword(req);

        assertThat(user.getPasswordHash()).isEqualTo("encoded-newpassword");
        verify(users).save(user);
        verify(redis).delete("pwreset:reset-token-123");
    }

    @Test
    @DisplayName("resetPassword(): expired/invalid token -> throws BadRequestException")
    void resetPassword_invalidToken() {
        ResetPasswordRequest req = new ResetPasswordRequest("invalid-token", "newpassword");

        when(valueOperations.get("pwreset:invalid-token")).thenReturn(null);

        assertThatThrownBy(() -> authService.resetPassword(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid or expired reset token");
    }
}
