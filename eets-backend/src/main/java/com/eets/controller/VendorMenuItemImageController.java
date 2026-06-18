package com.eets.controller;
 
import com.eets.dto.response.CloudinaryUploadResponse;
import com.eets.security.CurrentUser;
import com.eets.service.MenuItemImageService;
import com.eets.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
 
/**
 * Vendor-facing endpoints for managing menu-item images.
 *
 * <pre>
 * POST   /api/vendor/menu-items/{id}/image  ← upload / replace image
 * DELETE /api/vendor/menu-items/{id}/image  ← remove image
 * </pre>
 */
@Tag(name = "Vendor – Menu Item Images")
@RestController
@RequestMapping("/api/vendor/menu-items")
@RequiredArgsConstructor
public class VendorMenuItemImageController {
 
    private final MenuItemImageService menuItemImageService;
 
    @Deprecated
    @Operation(summary = "Upload or replace a menu-item image")
    @PostMapping(value = "/{menuItemId}/image",
                 consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CloudinaryUploadResponse> uploadImage(
            @PathVariable Long menuItemId,
            @RequestPart("file") MultipartFile file) {
        return ApiResponse.ok(
                menuItemImageService.updateMenuItemImage(CurrentUser.id(), menuItemId, file));
    }
 
    @Operation(summary = "Remove the image from a menu item")
    @DeleteMapping("/{menuItemId}/image")
    public ApiResponse<Void> removeImage(@PathVariable Long menuItemId) {
        menuItemImageService.removeMenuItemImage(CurrentUser.id(), menuItemId);
        return ApiResponse.ok("Image removed", null);
    }
}