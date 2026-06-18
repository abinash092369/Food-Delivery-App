package com.eets.controller;
 
import com.eets.security.CurrentUser;
import com.eets.service.ReviewImageService;
import com.eets.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
 
import java.util.List;
 
/**
 * Customer-facing endpoints for review image management.
 *
 * <pre>
 * POST   /api/reviews/{id}/images             ← add images to a review (max 5 total)
 * DELETE /api/reviews/{id}/images?url={url}   ← remove a specific image by URL
 * </pre>
 */
@Tag(name = "Reviews – Images")
@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewImageController {
 
    private final ReviewImageService reviewImageService;
 
    @Deprecated
    @Operation(summary = "Upload images for a review (max 5 total per review)")
    @PostMapping(value = "/{reviewId}/images",
                 consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<List<String>> addReviewImages(
            @PathVariable Long reviewId,
            @RequestPart("files") List<MultipartFile> files) {
        return ApiResponse.ok(
                reviewImageService.addImages(CurrentUser.id(), reviewId, files));
    }
 
    @Operation(summary = "Remove a specific image from a review by its URL")
    @DeleteMapping("/{reviewId}/images")
    public ApiResponse<List<String>> removeReviewImage(
            @PathVariable Long reviewId,
            @RequestParam String url) {
        return ApiResponse.ok(
                reviewImageService.removeImage(CurrentUser.id(), reviewId, url));
    }
}