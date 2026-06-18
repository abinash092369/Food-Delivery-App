package com.eets.controller;
 
import com.eets.dto.response.CloudinaryUploadResponse;
import com.eets.security.CurrentUser;
import com.eets.service.RestaurantImageService;
import com.eets.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
 
/**
 * Vendor-facing endpoints for uploading restaurant logo and banner images.
 *
 * <pre>
 * POST /api/vendor/restaurants/{id}/logo    ← upload / replace logo
 * POST /api/vendor/restaurants/{id}/banner  ← upload / replace banner
 * </pre>
 *
 * Both endpoints upload to Cloudinary, persist the returned URL on the
 * {@code Restaurant} entity, and clean up the old asset.
 */
@Tag(name = "Vendor – Restaurant Images")
@RestController
@RequestMapping("/api/vendor/restaurants")
@RequiredArgsConstructor
public class VendorRestaurantImageController {
 
    private final RestaurantImageService restaurantImageService;
 
    @Deprecated
    @Operation(summary = "Upload or replace restaurant logo")
    @PostMapping(value = "/{restaurantId}/logo",
                 consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CloudinaryUploadResponse> uploadLogo(
            @PathVariable Long restaurantId,
            @RequestPart("file") MultipartFile file) {
        return ApiResponse.ok(
                restaurantImageService.updateLogo(CurrentUser.id(), restaurantId, file));
    }
 
    @Deprecated
    @Operation(summary = "Upload or replace restaurant banner / cover image")
    @PostMapping(value = "/{restaurantId}/banner",
                 consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CloudinaryUploadResponse> uploadBanner(
            @PathVariable Long restaurantId,
            @RequestPart("file") MultipartFile file) {
        return ApiResponse.ok(
                restaurantImageService.updateBanner(CurrentUser.id(), restaurantId, file));
    }
}