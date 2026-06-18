package com.eets.util;

import lombok.experimental.UtilityClass;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Utility methods for working with Cloudinary URLs.
 *
 * <p>Centralises public_id extraction so that {@code RestaurantImageService},
 * {@code MenuItemImageService}, and {@code ReviewImageService} don't each
 * re-implement the same URL-parsing logic.</p>
 */
@UtilityClass
public class CloudinaryUtils {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryUtils.class);

    /**
     * Extract the Cloudinary {@code public_id} from a Cloudinary secure URL.
     *
     * <p>Example URL:
     * {@code https://res.cloudinary.com/mycloud/image/upload/v1718123456/eets/restaurants/logos/restaurant_42_logo.webp}
     * → {@code eets/restaurants/logos/restaurant_42_logo}</p>
     *
     * @param url a Cloudinary image URL (may be null / blank)
     * @return the public_id, or {@code null} if the URL is not a Cloudinary upload URL
     */
    public static String extractPublicId(String url) {
        if (url == null || url.isBlank()) return null;
        try {
            String path = url.split("\\?")[0];                   // strip query string
            int uploadIdx = path.indexOf("/upload/");
            if (uploadIdx < 0) return null;

            String afterUpload = path.substring(uploadIdx + "/upload/".length());

            // Strip the optional version segment: v1718123456/
            if (afterUpload.matches("v\\d+/.*")) {
                afterUpload = afterUpload.substring(afterUpload.indexOf('/') + 1);
            }

            // Strip the file extension
            int dotIdx = afterUpload.lastIndexOf('.');
            return dotIdx > 0 ? afterUpload.substring(0, dotIdx) : afterUpload;

        } catch (Exception e) {
            log.warn("Could not extract public_id from Cloudinary URL: {}", url);
            return null;
        }
    }

    /**
     * Build a Cloudinary transformation URL (auto format + quality).
     *
     * <p>Example:
     * input  → {@code https://res.cloudinary.com/c/image/upload/v1/eets/logos/foo.jpg}
     * output → {@code https://res.cloudinary.com/c/image/upload/f_auto,q_auto/eets/logos/foo.jpg}</p>
     *
     * @param url raw Cloudinary URL
     * @return URL with {@code f_auto,q_auto} transformation injected, or the original if it can't be parsed
     */
    public static String withAutoQuality(String url) {
        if (url == null || url.isBlank()) return url;
        int uploadIdx = url.indexOf("/upload/");
        if (uploadIdx < 0) return url;
        return url.substring(0, uploadIdx + "/upload/".length())
                + "f_auto,q_auto/"
                + url.substring(uploadIdx + "/upload/".length());
    }

    /**
     * Check whether a URL looks like a valid Cloudinary image URL.
     */
    public static boolean isCloudinaryUrl(String url) {
        return url != null && url.contains("res.cloudinary.com") && url.contains("/upload/");
    }
}
