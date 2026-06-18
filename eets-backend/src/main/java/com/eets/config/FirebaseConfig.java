package com.eets.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;

/**
 * Firebase Admin SDK configuration.
 * Supports both file-system path and classpath resource lookup.
 * Gracefully disables Firebase when no valid service account is found.
 */
@Slf4j
@Configuration
public class FirebaseConfig {

    @Value("${firebase.service-account-path:}")
    private String serviceAccountPath;

    @Value("${firebase.enabled:true}")
    private boolean firebaseEnabled;

    @PostConstruct
    public void init() {
        if (!firebaseEnabled) {
            log.info("Firebase explicitly disabled via firebase.enabled=false");
            return;
        }
        if (serviceAccountPath == null || serviceAccountPath.isBlank()) {
            log.info("Firebase disabled: no service-account-path configured");
            return;
        }
        if (!FirebaseApp.getApps().isEmpty()) {
            log.info("Firebase already initialized, skipping");
            return;
        }
        try (InputStream in = resolveServiceAccountStream(serviceAccountPath)) {
            if (in == null) {
                log.warn("Firebase service account not found at '{}'. Push notifications disabled.", serviceAccountPath);
                return;
            }
            FirebaseOptions opts = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(in))
                    .build();
            FirebaseApp.initializeApp(opts);
            log.info("Firebase Admin SDK initialized successfully");
        } catch (Exception e) {
            log.warn("Firebase initialization failed: {}. Push notifications disabled.", e.getMessage());
        }
    }

    private InputStream resolveServiceAccountStream(String path) {
        // 1. Try as absolute / relative filesystem path
        File file = new File(path);
        if (file.exists()) {
            try { return new FileInputStream(file); }
            catch (Exception e) { log.debug("Cannot open file '{}': {}", path, e.getMessage()); }
        }
        // 2. Try as classpath resource
        try {
            ClassPathResource resource = new ClassPathResource(path);
            if (resource.exists()) return resource.getInputStream();
        } catch (Exception e) {
            log.debug("Cannot load classpath '{}': {}", path, e.getMessage());
        }
        return null;
    }

    /** Bean that can be injected to check if Firebase is live. */
    @Bean
    public FirebaseAvailability firebaseAvailability() {
        return new FirebaseAvailability();
    }

    public static class FirebaseAvailability {
        public boolean isAvailable() {
            try { return !FirebaseApp.getApps().isEmpty(); }
            catch (Exception e) { return false; }
        }
    }
}
