package com.eets.service;
 
import com.eets.domain.MenuItem;
import com.eets.domain.Restaurant;
import com.eets.dto.response.CloudinaryUploadResponse;
import com.eets.exception.ResourceNotFoundException;
import com.eets.exception.UnauthorizedException;
import com.eets.repository.MenuItemRepository;
import com.eets.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
 
/**
 * Handles Cloudinary uploads for {@link MenuItem} photos.
 *
 * <p>Upload → persist imageUrl on MenuItem → delete old asset.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class MenuItemImageService {
 
    private final MenuItemRepository menuItems;
    private final RestaurantRepository restaurants;
    private final CloudinaryUploadService cloudinary;
    private final CacheService cacheService;
 
    /**
     * Upload (or replace) the image for a menu item.
     *
     * @param vendorUserId authenticated vendor
     * @param menuItemId   target menu item
     * @param file         new image file
     */
    public CloudinaryUploadResponse updateMenuItemImage(
            Long vendorUserId, Long menuItemId, MultipartFile file) {
 
        MenuItem item = menuItems.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found"));
 
        // Verify vendor owns the restaurant that contains this item
        Restaurant restaurant = restaurants.findById(item.getRestaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));
        if (!restaurant.getOwnerId().equals(vendorUserId)) {
            throw new UnauthorizedException("Not your menu item");
        }
 
        String oldPublicId = extractPublicId(item.getImageUrl());
 
        CloudinaryUploadResponse result = cloudinary.uploadMenuItemImage(file, menuItemId);
 
        item.setImageUrl(result.secureUrl());
        menuItems.save(item);
        cacheService.evictMenu(item.getRestaurantId());
 
        if (oldPublicId != null && !oldPublicId.equals(result.publicId())) {
            try {
                cloudinary.deleteImage(oldPublicId);
            } catch (Exception ex) {
                log.warn("Could not delete old menu-item image '{}': {}", oldPublicId, ex.getMessage());
            }
        }
 
        return result;
    }
 
    /**
     * Remove the menu-item image (sets imageUrl to null and deletes from Cloudinary).
     */
    public void removeMenuItemImage(Long vendorUserId, Long menuItemId) {
        MenuItem item = menuItems.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found"));
 
        Restaurant restaurant = restaurants.findById(item.getRestaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));
        if (!restaurant.getOwnerId().equals(vendorUserId)) {
            throw new UnauthorizedException("Not your menu item");
        }
 
        String oldPublicId = extractPublicId(item.getImageUrl());
        item.setImageUrl(null);
        menuItems.save(item);
        cacheService.evictMenu(item.getRestaurantId());
 
        if (oldPublicId != null) {
            try {
                cloudinary.deleteImage(oldPublicId);
            } catch (Exception ex) {
                log.warn("Could not delete menu-item image '{}': {}", oldPublicId, ex.getMessage());
            }
        }
    }
 
    // Same URL parsing logic as RestaurantImageService
    // Delegated to CloudinaryUtils.extractPublicId()
    private String extractPublicId(String url) {
        if (url == null || url.isBlank()) return null;
        try {
            String path = url.split("\\?")[0];
            int uploadIdx = path.indexOf("/upload/");
            if (uploadIdx < 0) return null;
            String afterUpload = path.substring(uploadIdx + "/upload/".length());
            if (afterUpload.startsWith("v") && afterUpload.indexOf('/') > 0) {
                afterUpload = afterUpload.substring(afterUpload.indexOf('/') + 1);
            }
            int dotIdx = afterUpload.lastIndexOf('.');
            return dotIdx > 0 ? afterUpload.substring(0, dotIdx) : afterUpload;
        } catch (Exception e) {
            log.warn("Could not extract public_id from URL: {}", url);
            return null;
        }
    }
}