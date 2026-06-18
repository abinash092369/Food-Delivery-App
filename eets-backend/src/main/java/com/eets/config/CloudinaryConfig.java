package com.eets.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cloudinary configuration.
 *
 * Required env vars (see .env.example):
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *
 * Folder constants are centralised here so every upload goes to a
 * predictable, policy-enforceable path in your Cloudinary media library.
 */
@Configuration
public class CloudinaryConfig {

    // ------------------------------------------------------------------ folders
    public static final String FOLDER_RESTAURANT_LOGOS   = "eets/restaurants/logos";
    public static final String FOLDER_RESTAURANT_BANNERS = "eets/restaurants/banners";
    public static final String FOLDER_MENU_ITEMS         = "eets/menu-items";
    public static final String FOLDER_REVIEW_IMAGES      = "eets/reviews";
    public static final String FOLDER_USER_AVATARS       = "eets/users/avatars";
    public static final String FOLDER_DRIVER_DOCS        = "eets/drivers/documents";

    // ------------------------------------------------------- quality presets
    /** Used as the `transformation` tag on uploads so Cloudinary auto-optimises. */
    public static final String PRESET_LOGO   = "eets_logo";
    public static final String PRESET_BANNER = "eets_banner";
    public static final String PRESET_THUMB  = "eets_thumb";

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key",    apiKey,
                "api_secret", apiSecret,
                "secure",     true
        ));
    }
}
