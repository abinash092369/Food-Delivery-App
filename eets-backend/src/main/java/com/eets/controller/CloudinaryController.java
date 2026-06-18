package com.eets.controller;
 
import com.eets.dto.request.CloudinaryBatchDeleteRequest;
import com.eets.dto.request.CloudinaryDeleteRequest;
import com.eets.dto.request.CloudinarySignRequest;
import com.eets.dto.response.CloudinarySignResponse;
import com.eets.dto.response.CloudinaryUploadResponse;
import com.eets.dto.response.CloudinaryUploadTokenResponse;
import com.eets.security.CurrentUser;
import com.eets.service.CloudinaryUploadService;
import com.eets.service.MenuItemImageService;
import com.eets.service.RestaurantImageService;
import com.eets.service.ReviewImageService;
import com.eets.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
 
import java.util.List;
 
@Tag(name = "Cloudinary", description = "Image upload, replace and delete operations")
@RestController
@RequestMapping("/api/cloudinary")
@RequiredArgsConstructor
public class CloudinaryController {
 
    private final CloudinaryUploadService cloudinaryService;
 
    // ── NEW: inject the image services that handle DB persistence ──
    private final RestaurantImageService restaurantImageService;
    private final MenuItemImageService menuItemImageService;
    private final ReviewImageService reviewImageService;
 
    // ---------------------------------------------------------------- sign (client-side upload)
 
    @Operation(summary = "Generate signed upload parameters for browser direct-upload")
    @PostMapping("/sign-upload")
    public ApiResponse<CloudinarySignResponse> signUpload(
            @Valid @RequestBody CloudinarySignRequest req) {
        return ApiResponse.ok(cloudinaryService.sign(req));
    }

    @Operation(summary = "Generate signed upload token and parameters for browser direct-upload")
    @GetMapping("/upload-token")
    public ApiResponse<CloudinaryUploadTokenResponse> getUploadToken(
            @RequestParam String folder) {
        return ApiResponse.ok(cloudinaryService.generateUploadToken(folder));
    }
 
    // ---------------------------------------------------------------- generic server-side uploads
    // These endpoints upload to Cloudinary only — no DB entity is updated.
    // Use them for misc / temporary uploads where you manage the URL yourself.
 
    @Deprecated
    @Operation(summary = "Upload a single image (generic – Cloudinary only, no DB update)")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CloudinaryUploadResponse> upload(
            @Parameter(description = "Image file") @RequestPart("file") MultipartFile file,
            @Parameter(description = "Cloudinary folder path")
            @RequestParam(defaultValue = "eets/misc") String folder) {
        return ApiResponse.ok(cloudinaryService.uploadImage(file, folder));
    }
 
    @Deprecated
    @Operation(summary = "Upload multiple images to the same folder (max 10, Cloudinary only)")
    @PostMapping(value = "/upload/multiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<List<CloudinaryUploadResponse>> uploadMultiple(
            @Parameter(description = "Image files") @RequestPart("files") List<MultipartFile> files,
            @Parameter(description = "Cloudinary folder path")
            @RequestParam(defaultValue = "eets/misc") String folder) {
        return ApiResponse.ok(cloudinaryService.uploadMultiple(files, folder));
    }
 
    @Deprecated
    @Operation(summary = "Replace an existing image (upload new, delete old – Cloudinary only)")
    @PostMapping(value = "/upload/replace", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CloudinaryUploadResponse> replace(
            @Parameter(description = "New image file") @RequestPart("file") MultipartFile file,
            @Parameter(description = "Cloudinary folder for the new image")
            @RequestParam(defaultValue = "eets/misc") String folder,
            @Parameter(description = "public_id of the image to delete (leave blank to skip)")
            @RequestParam(required = false) String oldPublicId) {
        return ApiResponse.ok(cloudinaryService.replaceImage(file, folder, oldPublicId));
    }
 
    // ---------------------------------------------------------------- restaurant
    // FIX: was calling cloudinaryService.uploadRestaurantLogo/Banner directly,
    //      which uploaded to Cloudinary but NEVER wrote the URL back to the DB.
    //      Now delegates to RestaurantImageService which uploads AND persists.
 
    @Deprecated
    @Operation(summary = "Upload / replace restaurant logo – also persists logo_url in DB")
    @PostMapping(value = "/restaurant/{restaurantId}/logo",
                 consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CloudinaryUploadResponse> uploadRestaurantLogo(
            @PathVariable Long restaurantId,
            @RequestPart("file") MultipartFile file) {
        return ApiResponse.ok(
                restaurantImageService.updateLogo(CurrentUser.id(), restaurantId, file));
    }
 
    @Deprecated
    @Operation(summary = "Upload / replace restaurant banner – also persists cover_image_url in DB")
    @PostMapping(value = "/restaurant/{restaurantId}/banner",
                 consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CloudinaryUploadResponse> uploadRestaurantBanner(
            @PathVariable Long restaurantId,
            @RequestPart("file") MultipartFile file) {
        return ApiResponse.ok(
                restaurantImageService.updateBanner(CurrentUser.id(), restaurantId, file));
    }
 
    // ---------------------------------------------------------------- menu item
    // FIX: same issue – was bypassing MenuItemImageService and never saving to DB.
 
    @Deprecated
    @Operation(summary = "Upload / replace menu-item image – also persists image_url in DB")
    @PostMapping(value = "/menu-item/{menuItemId}/image",
                 consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CloudinaryUploadResponse> uploadMenuItemImage(
            @PathVariable Long menuItemId,
            @RequestPart("file") MultipartFile file) {
        return ApiResponse.ok(
                menuItemImageService.updateMenuItemImage(CurrentUser.id(), menuItemId, file));
    }
 
    // ---------------------------------------------------------------- review images
    // FIX: was calling cloudinaryService.uploadReviewImages which uploads to Cloudinary
    //      but NEVER appended URLs to Review.images or called reviews.save().
    //      Now delegates to ReviewImageService which uploads AND persists the JSON array.
 
    @Deprecated
    @Operation(summary = "Upload review images – also appends URLs to reviews.images in DB")
    @PostMapping(value = "/review/{reviewId}/images",
                 consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<List<String>> uploadReviewImages(
            @PathVariable Long reviewId,
            @RequestPart("files") List<MultipartFile> files) {
        // Returns the full updated list of image URLs for the review
        return ApiResponse.ok(
                reviewImageService.addImages(CurrentUser.id(), reviewId, files));
    }
 
    // ---------------------------------------------------------------- delete
 
    @Operation(summary = "Delete a single image by public_id")
    @DeleteMapping("/delete")
    public ApiResponse<Void> deleteImage(
            @Valid @RequestBody CloudinaryDeleteRequest req) {
        cloudinaryService.deleteImage(req.publicId());
        return ApiResponse.ok("Image deleted", null);
    }
 
    @Operation(summary = "Batch delete images by public_id list")
    @DeleteMapping("/delete/batch")
    public ApiResponse<Void> deleteImages(
            @Valid @RequestBody CloudinaryBatchDeleteRequest req) {
        cloudinaryService.deleteImages(req.publicIds());
        return ApiResponse.ok("Images deleted", null);
    }
}