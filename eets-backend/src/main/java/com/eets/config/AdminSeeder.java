package com.eets.config;

import com.eets.domain.Role;
import com.eets.domain.User;
import com.eets.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        String adminEmail = "admin@eets.com";
        User admin = userRepository.findByEmail(adminEmail).orElse(null);
        if (admin == null) {
            log.info("Seeding default SUPER_ADMIN user: {}", adminEmail);
            admin = User.builder()
                    .name("Super Admin")
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode("admin123456"))
                    .role(Role.SUPER_ADMIN)
                    .isActive(true)
                    .isEmailVerified(true)
                    .isPhoneVerified(true)
                    .build();
            userRepository.save(admin);
            log.info("Default SUPER_ADMIN user seeded successfully");
        } else {
            log.info("Default SUPER_ADMIN user already exists. Updating password, role and status to ensure validity.");
            admin.setPasswordHash(passwordEncoder.encode("admin123456"));
            admin.setRole(Role.SUPER_ADMIN);
            admin.setIsActive(true);
            admin.setIsBanned(false);
            admin.setIsEmailVerified(true);
            admin.setIsPhoneVerified(true);
            userRepository.save(admin);
            log.info("Default SUPER_ADMIN user updated successfully");
        }
    }
}
