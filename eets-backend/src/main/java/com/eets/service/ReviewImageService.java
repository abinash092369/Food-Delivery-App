package com.eets.service;
 
import com.eets.domain.Review;
import com.eets.dto.response.CloudinaryUploadResponse;
import com.eets.exception.BadRequestException;
import com.eets.exception.ResourceNotFoundException;
import com.eets.exception.UnauthorizedException;
import com.eets.repository.ReviewRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
 
import java.util.ArrayList;
import java.util.List;
 
/**
 * Handles Cloudinary uploads for {@link Review} images.
 *
 * <p>Review images are stored as a JSON array of URLs in {@code Review.images}.
 * A maximum of 5 images per review is enforced.
 * Existing images are preserved; new uploads are appended up to the limit.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ReviewImageService {
 
    private static final int MAX_IMAGES = 5;
 
    private final ReviewRepository reviews;
    private final CloudinaryUploadService cloudinary;
    private final ObjectMapper objectMapper;
 
    /**
     * Upload photos for a review and append their URLs to {@code Review.images}.
     *
     * @param userId   authenticated user – must own the review
     * @param reviewId target review
     * @param files    image files to upload
     * @return the full (updated) list of image URLs for the review
     */
    public List<String> addImages(Long userId, Long reviewId, List<MultipartFile> files) {
        Review review = reviews.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
 
        if (!review.getUserId().equals(userId)) {
            throw new UnauthorizedException("Not your review");
        }
 
        List<String> existing = parseImages(review.getImages());
 
        int slots = MAX_IMAGES - existing.size();
        if (slots <= 0) {
            throw new BadRequestException("Review already has the maximum of " + MAX_IMAGES + " images");
        }
        if (files.size() > slots) {
            throw new BadRequestException(
                    "Only " + slots + " image slot(s) remaining (max " + MAX_IMAGES + ")");
        }
 
        List<CloudinaryUploadResponse> uploaded = cloudinary.uploadReviewImages(files, reviewId);
 
        List<String> updated = new ArrayList<>(existing);
        uploaded.forEach(r -> updated.add(r.secureUrl()));
 
        review.setImages(toJson(updated));
        reviews.save(review);
 
        return updated;
    }
 
    /**
     * Remove a specific image from a review by its URL.
     * The corresponding Cloudinary asset is also deleted.
     */
    public List<String> removeImage(Long userId, Long reviewId, String imageUrl) {
        Review review = reviews.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
 
        if (!review.getUserId().equals(userId)) {
            throw new UnauthorizedException("Not your review");
        }
 
        List<String> existing = parseImages(review.getImages());
        if (!existing.remove(imageUrl)) {
            throw new BadRequestException("Image URL not found on this review");
        }
 
        review.setImages(toJson(existing));
        reviews.save(review);
 
        // Best-effort delete from Cloudinary
        String publicId = extractPublicId(imageUrl);
        if (publicId != null) {
            try {
                cloudinary.deleteImage(publicId);
            } catch (Exception ex) {
                log.warn("Could not delete review image '{}': {}", publicId, ex.getMessage());
            }
        }
 
        return existing;
    }
 
    // ---------------------------------------------------------------- helpers
 
    private List<String> parseImages(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return new ArrayList<>(
                    objectMapper.readValue(json, new TypeReference<List<String>>() {}));
        } catch (Exception e) {
            log.warn("Failed to parse review images JSON: {}", json);
            return new ArrayList<>();
        }
    }
 
    private String toJson(List<String> images) {
        try {
            return objectMapper.writeValueAsString(images);
        } catch (Exception e) {
            return "[]";
        }
    }
 
    // Delegated to CloudinaryUtils.extractPublicId()
    private String extractPublicId(String url) {
        if (url == null || url.isBlank()) return null;
        try {
            String path = url.split("\\?")[0];
            int idx = path.indexOf("/upload/");
            if (idx < 0) return null;
            String after = path.substring(idx + "/upload/".length());
            if (after.startsWith("v") && after.indexOf('/') > 0) {
                after = after.substring(after.indexOf('/') + 1);
            }
            int dot = after.lastIndexOf('.');
            return dot > 0 ? after.substring(0, dot) : after;
        } catch (Exception e) {
            return null;
        }
    }
}