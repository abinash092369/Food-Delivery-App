package com.eets.service;

import com.eets.domain.*;
import com.eets.dto.request.*;
import com.eets.dto.response.*;
import com.eets.exception.*;
import com.eets.repository.DeliveryPartnerRepository;
import com.eets.repository.RestaurantRepository;
import com.eets.repository.UserRepository;
import com.eets.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtTokenProvider jwt;
    private final EmailService emailService;
    private final OtpService otpService;
    private final StringRedisTemplate redis;
    private final RestaurantRepository restaurants;
    private final DeliveryPartnerRepository drivers;
    private final RestaurantService restaurantService;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AuthResponse register(RegisterRequest req) {
        if (users.existsByEmail(req.email())) throw new BadRequestException("Email already registered");
        if (req.phone() != null && users.existsByPhone(req.phone()))
            throw new BadRequestException("Phone already registered");

        User u = User.builder()
            .name(req.name()).email(req.email()).phone(req.phone())
            .passwordHash(encoder.encode(req.password()))
            .role(Role.CUSTOMER).isActive(true)
            .build();
        u = users.save(u);
        emailService.sendWelcomeEmail(u);
        String token = jwt.generateAccessToken(u.getId(), u.getEmail(), u.getRole(), null, null);
        return new AuthResponse(token, toUserResponse(u));
    }

    public AuthResponse login(LoginRequest req) {
        User u = users.findByEmail(req.email())
            .orElseThrow(() -> new BadRequestException("Invalid email or password"));
        if (Boolean.TRUE.equals(u.getIsBanned()))
            throw new UnauthorizedException("Account banned: " + u.getBanReason());
        if (u.getPasswordHash() == null || !encoder.matches(req.password(), u.getPasswordHash()))
            throw new BadRequestException("Invalid email or password");
        u.setLastLoginAt(Instant.now());
        users.save(u);
        String token = jwt.generateAccessToken(u.getId(), u.getEmail(), u.getRole(), null, null);
        return new AuthResponse(token, toUserResponse(u));
    }

    public AuthResponse vendorLogin(LoginRequest req) {
        User u = users.findByEmail(req.email())
            .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        if (Boolean.TRUE.equals(u.getIsBanned()))
            throw new UnauthorizedException("Account banned: " + u.getBanReason());

        if (u.getPasswordHash() == null || !encoder.matches(req.password(), u.getPasswordHash()))
            throw new BadRequestException("Invalid email or password");

        if (u.getRole() != Role.VENDOR)
            throw new UnauthorizedException("Vendor access only");

        Long restaurantId = restaurants.findByOwnerId(u.getId())
            .map(Restaurant::getId)
            .orElse(null);

        u.setLastLoginAt(Instant.now());
        users.save(u);

        String token = jwt.generateAccessToken(u.getId(), u.getEmail(), u.getRole(), restaurantId, null);
        return new AuthResponse(token, toUserResponse(u));
    }

    public void sendOtp(SendOtpRequest req) {
        otpService.sendOtp(req.phone(), req.countryCode());
    }

    public AuthResponse verifyOtp(VerifyOtpRequest req) {
        // FIX: countryCode forwarded so Twilio Verify can match the E.164 number
        otpService.verifyOtp(req.phone(), req.countryCode(), req.otp());

        boolean newUser = false;
        User u = users.findByPhone(req.phone()).orElse(null);
        if (u == null) {
            u = User.builder()
                .name("User " + req.phone().substring(req.phone().length() - 4))
                .email(req.phone() + "@phone.eets.local")
                .phone(req.phone())
                .role(Role.CUSTOMER)
                .isPhoneVerified(true)
                .isActive(true)
                .build();
            u = users.save(u);
            newUser = true;
        } else {
            if (Boolean.TRUE.equals(u.getIsBanned())) {
                throw new UnauthorizedException("Account banned: " + u.getBanReason());
            }
            u.setIsPhoneVerified(true);
            u.setLastLoginAt(Instant.now());
            users.save(u);
        }
        String token = jwt.generateAccessToken(u.getId(), u.getEmail(), u.getRole(), null, null);
        return new AuthResponse(token, toUserResponse(u), newUser);
    }

    public AuthResponse verifyDriverOtp(VerifyOtpRequest req) {
        otpService.verifyOtp(req.phone(), req.countryCode(), req.otp());

        boolean newUser = false;
        User u = users.findByPhone(req.phone()).orElse(null);
        if (u == null) {
            u = User.builder()
                .name("Driver " + req.phone().substring(req.phone().length() - 4))
                .email(req.phone() + "@driver.eets.local")
                .phone(req.phone())
                .role(Role.DRIVER)
                .isPhoneVerified(true)
                .isActive(true)
                .build();
            u = users.save(u);
            newUser = true;
        } else {
            if (Boolean.TRUE.equals(u.getIsBanned())) {
                throw new UnauthorizedException("Account banned: " + u.getBanReason());
            }
            if (u.getRole() == Role.CUSTOMER) {
                u.setRole(Role.DRIVER);
            } else if (u.getRole() != Role.DRIVER) {
                throw new BadRequestException("Phone already used by another role");
            }
            u.setIsPhoneVerified(true);
            u.setLastLoginAt(Instant.now());
            users.save(u);
        }

        Long driverId = drivers.findByUserId(u.getId())
            .map(DeliveryPartner::getId)
            .orElse(null);

        String token = jwt.generateAccessToken(u.getId(), u.getEmail(), u.getRole(), null, driverId);
        return new AuthResponse(token, toUserResponse(u), newUser);
    }

    public AuthResponse googleLogin(GoogleLoginRequest req) {
        try {
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + req.idToken();
            String body = restTemplate.getForObject(url, String.class);
            JsonNode node = objectMapper.readTree(body);
            String email = node.path("email").asText();
            String name = node.path("name").asText("User");
            String googleId = node.path("sub").asText();
            String picture = node.path("picture").asText(null);
            if (email == null || email.isBlank()) throw new BadRequestException("Invalid Google token");

            User u = users.findByGoogleId(googleId).or(() -> users.findByEmail(email)).orElse(null);
            if (u == null) {
                u = User.builder().name(name).email(email).googleId(googleId)
                    .profileImageUrl(picture).role(Role.CUSTOMER)
                    .isEmailVerified(true).isActive(true).build();
                u = users.save(u);
                emailService.sendWelcomeEmail(u);
            } else {
                if (Boolean.TRUE.equals(u.getIsBanned())) {
                    throw new UnauthorizedException("Account banned: " + u.getBanReason());
                }
                if (u.getGoogleId() == null) {
                    u.setGoogleId(googleId);
                    users.save(u);
                }
            }
            String token = jwt.generateAccessToken(u.getId(), u.getEmail(), u.getRole(), null, null);
            return new AuthResponse(token, toUserResponse(u));
        } catch (BadRequestException e) { throw e; }
        catch (UnauthorizedException e) { throw e; }
        catch (Exception e) {
            log.error("Google login failed", e);
            throw new BadRequestException("Google authentication failed");
        }
    }

    public GoogleVendorAuthResponse googleVendorLogin(GoogleVendorLoginRequest req) {
        try {
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + req.credential();
            String body = restTemplate.getForObject(url, String.class);
            JsonNode node = objectMapper.readTree(body);
            String email = node.path("email").asText();
            String name = node.path("name").asText("User");
            String googleId = node.path("sub").asText();
            String picture = node.path("picture").asText(null);
            if (email == null || email.isBlank()) throw new BadRequestException("Invalid Google token");

            User u = users.findByGoogleId(googleId).or(() -> users.findByEmail(email)).orElse(null);
            if (u == null) {
                u = User.builder()
                    .name(name)
                    .email(email)
                    .googleId(googleId)
                    .profileImageUrl(picture)
                    .role(Role.VENDOR)
                    .isEmailVerified(true)
                    .isActive(true)
                    .build();
                u = users.save(u);
                emailService.sendWelcomeEmail(u);
            } else {
                if (Boolean.TRUE.equals(u.getIsBanned())) {
                    throw new UnauthorizedException("Account banned: " + u.getBanReason());
                }
                if (u.getGoogleId() == null) {
                    u.setGoogleId(googleId);
                }
                if (u.getRole() == Role.CUSTOMER) {
                    u.setRole(Role.VENDOR);
                } else if (u.getRole() != Role.VENDOR) {
                    throw new BadRequestException("Email is registered with a different role");
                }
                users.save(u);
            }

            Restaurant r = restaurants.findByOwnerId(u.getId()).orElse(null);
            if (r == null) {
                String restaurantName = name + "'s Restaurant";
                String slug = com.eets.util.SlugUtil.slugify(restaurantName) + "-" + System.currentTimeMillis() % 100000;
                r = Restaurant.builder()
                    .ownerId(u.getId())
                    .name(restaurantName)
                    .slug(slug)
                    .isOpen(false)
                    .isActive(true)
                    .isApproved(false)
                    .build();
                r = restaurants.save(r);
            }

            String token = jwt.generateAccessToken(u.getId(), u.getEmail(), u.getRole(), r.getId(), null);
            String refreshToken = generateRefreshToken(u.getId());
            
            return new GoogleVendorAuthResponse(token, refreshToken, toUserResponse(u), restaurantService.toDetail(r));
        } catch (BadRequestException e) { throw e; }
        catch (UnauthorizedException e) { throw e; }
        catch (Exception e) {
            log.error("Vendor Google login failed", e);
            throw new BadRequestException("Google authentication failed");
        }
    }

    public String refreshToken(Long userId, String token) {
        String savedToken = redis.opsForValue().get("refresh:" + userId);
        if (savedToken == null || !savedToken.equals(token)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }
        User u = users.findById(userId).orElseThrow(() -> new UnauthorizedException("User not found"));
        if (Boolean.TRUE.equals(u.getIsBanned())) {
            throw new UnauthorizedException("Account banned: " + u.getBanReason());
        }
        Long restaurantId = null;
        Long driverId = null;
        if (u.getRole() == Role.VENDOR) {
            restaurantId = restaurants.findByOwnerId(u.getId()).map(Restaurant::getId).orElse(null);
        } else if (u.getRole() == Role.DRIVER) {
            driverId = drivers.findByUserId(u.getId()).map(DeliveryPartner::getId).orElse(null);
        }
        return jwt.generateAccessToken(u.getId(), u.getEmail(), u.getRole(), restaurantId, driverId);
    }

    public String generateRefreshToken(Long userId) {
        String token = jwt.generateRefreshToken(userId);
        redis.opsForValue().set("refresh:" + userId, token, Duration.ofMillis(jwt.getRefreshExpiry()));
        return token;
    }

    public void revokeRefreshToken(Long userId) {
        redis.delete("refresh:" + userId);
    }

    public void logout(String accessToken) {
        if (accessToken == null) return;
        try {
            var c = jwt.parse(accessToken);
            long ttl = Math.max(1, c.getExpiration().getTime() - System.currentTimeMillis());
            redis.opsForValue().set("blacklist:" + accessToken, "1", Duration.ofMillis(ttl));
        } catch (Exception ignored) {}
    }

    public void forgotPassword(ForgotPasswordRequest req) {
        users.findByEmail(req.email()).ifPresent(u -> {
            String token = UUID.randomUUID().toString();
            redis.opsForValue().set("pwreset:" + token, String.valueOf(u.getId()), Duration.ofMinutes(15));
            emailService.sendPasswordResetEmail(u, token);
        });
    }

    public void resetPassword(ResetPasswordRequest req) {
        String key = "pwreset:" + req.token();
        String userId = redis.opsForValue().get(key);
        if (userId == null) throw new BadRequestException("Invalid or expired reset token");
        User u = users.findById(Long.valueOf(userId)).orElseThrow(() -> new BadRequestException("User not found"));
        u.setPasswordHash(encoder.encode(req.newPassword()));
        users.save(u);
        redis.delete(key);
    }

    public UserResponse toUserResponse(User u) {
        return new UserResponse(u.getId(), u.getName(), u.getEmail(), u.getPhone(),
            u.getProfileImageUrl(), u.getRole(), u.getIsEmailVerified(), u.getIsPhoneVerified(),
            u.getIsActive(), u.getCreatedAt());
    }
}