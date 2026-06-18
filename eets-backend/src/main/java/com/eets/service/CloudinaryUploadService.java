package com.eets.service;
 
import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import com.eets.config.CloudinaryConfig;
import com.eets.dto.request.CloudinarySignRequest;
import com.eets.dto.response.CloudinarySignResponse;
import com.eets.dto.response.CloudinaryUploadResponse;
import com.eets.dto.response.CloudinaryUploadTokenResponse;
import com.eets.exception.CloudinaryException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
 
import java.io.IOException;
import java.util.*;
 
@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryUploadService {
 
    private static final int    MAX_REVIEW_IMAGES   = 5;
    private static final int    MAX_BATCH_IMAGES    = 10;
    private static final long   MAX_FILE_SIZE_MB    = 10;
    private static final long   MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
 
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif"
    );
 
    private final Cloudinary cloudinary;
 
    // ─────────────────────────────────────────────────────────────── public API
 
    public CloudinaryUploadResponse uploadImage(MultipartFile file, String folder) {
        validate(file);
        return doUpload(file, folder, null);
    }
 
    public List<CloudinaryUploadResponse> uploadMultiple(List<MultipartFile> files, String folder) {
        if (files == null || files.isEmpty()) {
            throw new CloudinaryException("No files provided");
        }
        if (files.size() > MAX_BATCH_IMAGES) {
            throw new CloudinaryException("Maximum " + MAX_BATCH_IMAGES + " files per request");
        }
        files.forEach(this::validate);
 
        List<CloudinaryUploadResponse> results = new ArrayList<>(files.size());
        for (MultipartFile file : files) {
            results.add(doUpload(file, folder, null));
        }
        return results;
    }
 
    public CloudinaryUploadResponse uploadRestaurantLogo(MultipartFile file, Long restaurantId) {
        validate(file);
        String publicId = CloudinaryConfig.FOLDER_RESTAURANT_LOGOS
                + "/restaurant_" + restaurantId + "_logo";
        return doUpload(file, CloudinaryConfig.FOLDER_RESTAURANT_LOGOS, publicId);
    }
 
    public CloudinaryUploadResponse uploadRestaurantBanner(MultipartFile file, Long restaurantId) {
        validate(file);
        String publicId = CloudinaryConfig.FOLDER_RESTAURANT_BANNERS
                + "/restaurant_" + restaurantId + "_banner";
        return doUpload(file, CloudinaryConfig.FOLDER_RESTAURANT_BANNERS, publicId);
    }
 
    public CloudinaryUploadResponse uploadMenuItemImage(MultipartFile file, Long menuItemId) {
        validate(file);
        String publicId = CloudinaryConfig.FOLDER_MENU_ITEMS + "/item_" + menuItemId;
        return doUpload(file, CloudinaryConfig.FOLDER_MENU_ITEMS, publicId);
    }
 
    public List<CloudinaryUploadResponse> uploadReviewImages(
            List<MultipartFile> files, Long reviewId) {
 
        if (files == null || files.isEmpty()) {
            throw new CloudinaryException("No files provided");
        }
        if (files.size() > MAX_REVIEW_IMAGES) {
            throw new CloudinaryException("Maximum " + MAX_REVIEW_IMAGES + " images per review");
        }
        files.forEach(this::validate);
 
        List<CloudinaryUploadResponse> results = new ArrayList<>(files.size());
        int idx = 1;
        for (MultipartFile file : files) {
            String publicId = CloudinaryConfig.FOLDER_REVIEW_IMAGES
                    + "/review_" + reviewId + "_" + idx++;
            results.add(doUpload(file, CloudinaryConfig.FOLDER_REVIEW_IMAGES, publicId));
        }
        return results;
    }
 
    public CloudinaryUploadResponse replaceImage(
            MultipartFile file, String folder, String oldPublicId) {
 
        validate(file);
        CloudinaryUploadResponse result = doUpload(file, folder, null);
 
        if (oldPublicId != null && !oldPublicId.isBlank()) {
            try {
                deleteImage(oldPublicId);
            } catch (CloudinaryException ex) {
                log.warn("Could not delete old Cloudinary asset '{}': {}",
                        oldPublicId, ex.getMessage());
            }
        }
        return result;
    }
 
    public void deleteImage(String publicId) {
        if (publicId == null || publicId.isBlank()) return;
        try {
            Map<?, ?> result = cloudinary.uploader()
                    .destroy(publicId, ObjectUtils.emptyMap());
            String status = (String) result.get("result");
            if (!"ok".equalsIgnoreCase(status) && !"not found".equalsIgnoreCase(status)) {
                throw new CloudinaryException(
                        "Delete failed for '" + publicId + "': " + status);
            }
            log.info("Deleted Cloudinary asset: {}", publicId);
        } catch (IOException e) {
            throw new CloudinaryException("Cloudinary delete error: " + e.getMessage(), e);
        }
    }
 
    public void deleteImages(List<String> publicIds) {
        if (publicIds == null || publicIds.isEmpty()) return;
        List<String> errors = new ArrayList<>();
        for (String id : publicIds) {
            try {
                deleteImage(id);
            } catch (CloudinaryException ex) {
                errors.add(id + ": " + ex.getMessage());
            }
        }
        if (!errors.isEmpty()) {
            log.warn("Some Cloudinary deletes failed: {}", errors);
        }
    }
 
    public CloudinarySignResponse sign(CloudinarySignRequest req) {
        long timestamp = System.currentTimeMillis() / 1000L;
        Map<String, Object> params = new TreeMap<>();
        params.put("folder",    req.folder());
        params.put("timestamp", timestamp);

        if (req.publicId() != null && !req.publicId().isBlank()) {
            params.put("public_id", req.publicId());
        }
        if (req.uploadPreset() != null && !req.uploadPreset().isBlank()) {
            params.put("upload_preset", req.uploadPreset());
        }
        if (req.extraParams() != null) {
            for (Map.Entry<String, String> entry : req.extraParams().entrySet()) {
                if (entry.getValue() != null) {
                    params.put(entry.getKey(), entry.getValue());
                }
            }
        }

        String signature = cloudinary.apiSignRequest(params, cloudinary.config.apiSecret);

        Map<String, String> responseParams = new TreeMap<>();
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            responseParams.put(entry.getKey(), String.valueOf(entry.getValue()));
        }

        return new CloudinarySignResponse(
                signature, timestamp,
                cloudinary.config.apiKey,
                cloudinary.config.cloudName,
                req.folder(),
                req.publicId(),
                req.uploadPreset(),
                responseParams);
    }

    public CloudinaryUploadTokenResponse generateUploadToken(String folder) {
        if (folder == null || folder.isBlank()) {
            throw new CloudinaryException("Folder is required");
        }

        String uploadPreset = "eets_thumb"; // default preset
        if (CloudinaryConfig.FOLDER_RESTAURANT_LOGOS.equals(folder)) {
            uploadPreset = CloudinaryConfig.PRESET_LOGO;
        } else if (CloudinaryConfig.FOLDER_RESTAURANT_BANNERS.equals(folder)) {
            uploadPreset = CloudinaryConfig.PRESET_BANNER;
        } else if (CloudinaryConfig.FOLDER_MENU_ITEMS.equals(folder)) {
            uploadPreset = CloudinaryConfig.PRESET_THUMB;
        }

        long timestamp = System.currentTimeMillis() / 1000L;

        Map<String, Object> params = new TreeMap<>();
        params.put("folder", folder);
        params.put("timestamp", timestamp);
        params.put("upload_preset", uploadPreset);

        String signature = cloudinary.apiSignRequest(params, cloudinary.config.apiSecret);

        return new CloudinaryUploadTokenResponse(
                cloudinary.config.cloudName,
                cloudinary.config.apiKey,
                timestamp,
                signature,
                folder,
                uploadPreset
        );
    }
 
    // ─────────────────────────────────────────────────────────────── internals
 
    @SuppressWarnings("unchecked")
    private CloudinaryUploadResponse doUpload(
            MultipartFile file, String folder, String publicId) {
 
        try {
            Map<String, Object> options = new HashMap<>();
            options.put("folder",          folder);
            options.put("resource_type",   "image");
            options.put("overwrite",       true);
            options.put("unique_filename", publicId == null);
 
            if (publicId != null) {
                options.put("public_id", publicId);
            }
 
            // Use fetch_format + quality via upload options (no eager — avoids ClassCastException)
            options.put("fetch_format", "auto");
            options.put("quality",      "auto");
 
            Map<String, Object> result =
                    (Map<String, Object>) cloudinary.uploader()
                            .upload(file.getBytes(), options);
 
            log.info("Uploaded to Cloudinary: public_id={}, url={}",
                    result.get("public_id"), result.get("secure_url"));
 
            return CloudinaryUploadResponse.fromMap(result);
 
        } catch (IOException e) {
            throw new CloudinaryException(
                    "Cloudinary upload failed: " + e.getMessage(), e);
        }
    }
 
    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new CloudinaryException("File is empty or missing");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new CloudinaryException(
                    "Unsupported file type: " + contentType
                    + ". Allowed types: jpeg, jpg, png, webp, gif");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new CloudinaryException(
                    "File too large. Maximum allowed size is " + MAX_FILE_SIZE_MB + " MB");
        }
    }
}