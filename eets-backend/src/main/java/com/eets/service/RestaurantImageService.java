package com.eets.service;
 
import com.eets.domain.Restaurant;
import com.eets.dto.response.CloudinaryUploadResponse;
import com.eets.exception.ResourceNotFoundException;
import com.eets.exception.UnauthorizedException;
import com.eets.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
 
/**
 * Handles image uploads that must also update a {@link Restaurant} record.
 *
 * <p>Upload → persist URL → (optionally) delete old Cloudinary asset.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RestaurantImageService {
 
    private final RestaurantRepository restaurants;
    private final CloudinaryUploadService cloudinary;
    private final CacheService cacheService;
 
    // ---------------------------------------------------------------- logo
 
    /**
     * Upload a new logo, persist the URL, and delete the previous logo from Cloudinary.
     *
     * @param vendorUserId the authenticated vendor – must own the restaurant
     * @param restaurantId target restaurant
     * @param file         the logo file
     * @return the Cloudinary upload result (contains secureUrl to store / return to client)
     */
    public CloudinaryUploadResponse updateLogo(
            Long vendorUserId, Long restaurantId, MultipartFile file) {
 
        Restaurant r = getOwnedRestaurant(vendorUserId, restaurantId);
 
        String oldPublicId = extractPublicId(r.getLogoUrl());
 
        CloudinaryUploadResponse result = cloudinary.uploadRestaurantLogo(file, restaurantId);
 
        r.setLogoUrl(result.secureUrl());
        restaurants.save(r);
        cacheService.evictRestaurant(r.getSlug());
 
        deleteOld(oldPublicId, result.publicId());
 
        return result;
    }
 
    // ---------------------------------------------------------------- banner
 
    /**
     * Upload a new banner, persist the URL, and delete the previous banner.
     *
     * @param vendorUserId the authenticated vendor – must own the restaurant
     * @param restaurantId target restaurant
     * @param file         the banner file
     */
    public CloudinaryUploadResponse updateBanner(
            Long vendorUserId, Long restaurantId, MultipartFile file) {
 
        Restaurant r = getOwnedRestaurant(vendorUserId, restaurantId);
 
        String oldPublicId = extractPublicId(r.getCoverImageUrl());
 
        CloudinaryUploadResponse result = cloudinary.uploadRestaurantBanner(file, restaurantId);
 
        r.setCoverImageUrl(result.secureUrl());
        restaurants.save(r);
        cacheService.evictRestaurant(r.getSlug());
 
        deleteOld(oldPublicId, result.publicId());
 
        return result;
    }
 
    // ---------------------------------------------------------------- helpers
 
    private Restaurant getOwnedRestaurant(Long vendorUserId, Long restaurantId) {
        Restaurant r = restaurants.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));
        if (!r.getOwnerId().equals(vendorUserId)) {
            throw new UnauthorizedException("Not your restaurant");
        }
        return r;
    }
 
    /**
     * Extract the Cloudinary public_id from a secure URL.
     * Cloudinary URLs look like:
     *   https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}.{ext}
     */
    // Delegated to CloudinaryUtils.extractPublicId()
    private String extractPublicId(String url) {
        if (url == null || url.isBlank()) return null;
        try {
            // Remove query string, find the segment after /upload/
            String path = url.split("\\?")[0];
            int uploadIdx = path.indexOf("/upload/");
            if (uploadIdx < 0) return null;
            String afterUpload = path.substring(uploadIdx + "/upload/".length());
            // Strip version segment (v1234567890/)
            if (afterUpload.startsWith("v") && afterUpload.indexOf('/') > 0) {
                afterUpload = afterUpload.substring(afterUpload.indexOf('/') + 1);
            }
            // Strip extension
            int dotIdx = afterUpload.lastIndexOf('.');
            return dotIdx > 0 ? afterUpload.substring(0, dotIdx) : afterUpload;
        } catch (Exception e) {
            log.warn("Could not extract public_id from URL: {}", url);
            return null;
        }
    }
 
    private void deleteOld(String oldPublicId, String newPublicId) {
        if (oldPublicId != null && !oldPublicId.equals(newPublicId)) {
            try {
                cloudinary.deleteImage(oldPublicId);
            } catch (Exception ex) {
                log.warn("Could not delete old image '{}': {}", oldPublicId, ex.getMessage());
            }
        }
    }
}