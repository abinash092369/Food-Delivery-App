package com.eets.config;
 
import com.eets.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;
import org.springframework.web.cors.CorsConfigurationSource;
 
import java.util.List;
 
@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {
 
    private final JwtAuthenticationFilter jwtFilter;
    private final com.eets.security.RateLimitingFilter rateLimitingFilter;
 
    @Value("${eets.frontend-urls.customer}") String customerUrl;
    @Value("${eets.frontend-urls.admin}") String adminUrl;
    @Value("${eets.frontend-urls.vendor}") String vendorUrl;
    @Value("${eets.frontend-urls.driver}") String driverUrl;
 
    @Bean
    public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }
 
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration c) throws Exception {
        return c.getAuthenticationManager();
    }
 
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(c -> c.disable())
            .cors(c -> c.configurationSource(corsSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(e -> e.authenticationEntryPoint(
                new org.springframework.security.web.authentication.HttpStatusEntryPoint(org.springframework.http.HttpStatus.UNAUTHORIZED)
            ))
            .authorizeHttpRequests(a -> a
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/ws/**", "/api/auth/**", "/api/admin/auth/**",
                                 "/api/vendor/auth/**",
                                 "/api/driver/auth/**",
                                 "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**",
                                 "/actuator/health").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/restaurants", "/api/restaurants/**",
                                 "/api/menu/**", "/api/search/**", "/api/search").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/local-image/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/local-image/upload").hasAnyRole("VENDOR", "ADMIN")
 
                .requestMatchers("/api/admin/settings/**", "/api/admin/fraud/**").hasRole("SUPER_ADMIN")
                .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                .requestMatchers("/api/vendor/**").hasRole("VENDOR")
                .requestMatchers("/api/driver/**").hasRole("DRIVER")
 
                .requestMatchers("/api/cart/**", "/api/users/me/**", "/api/coupons/validate",
                                 "/api/coupons", "/api/notifications/**", "/api/cloudinary/**", "/api/maps/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/reviews").hasRole("CUSTOMER")
                .requestMatchers(HttpMethod.POST, "/api/driver-reviews").hasRole("CUSTOMER")
                .requestMatchers(HttpMethod.GET, "/api/driver-reviews/**").authenticated()
                .requestMatchers("/api/orders/**").authenticated()
                .anyRequest().authenticated())
            .addFilterAfter(rateLimitingFilter, org.springframework.web.filter.CorsFilter.class)
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
 
    @Bean
    public CorsConfigurationSource corsSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of(
                customerUrl, adminUrl, vendorUrl, driverUrl,
                "http://localhost:8080",
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175",
                "http://localhost:5176",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:5174",
                "http://127.0.0.1:5175",
                "http://127.0.0.1:5176"
        ));
        cfg.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        cfg.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"));
        cfg.setAllowCredentials(true);
        cfg.setExposedHeaders(List.of("Authorization"));
        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }
}