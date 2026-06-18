package com.eets.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@RestController
@RequestMapping("/api/local-image")
public class LocalImageController {

    private static final Logger log = LoggerFactory.getLogger(LocalImageController.class);

    private Path getUploadDir() {
        Path workingDir = Paths.get("").toAbsolutePath();
        if (workingDir.getFileName().toString().equals("eets-backend")) {
            return workingDir.resolve("uploads");
        } else {
            return workingDir.resolve("eets-backend").resolve("uploads");
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadImage(@RequestParam("file") MultipartFile file) {
        String originalFilename = file != null ? file.getOriginalFilename() : "";
        log.info("[LOCAL_IMAGE_UPLOAD_START] file: {}", originalFilename);

        if (file == null || file.isEmpty()) {
            String msg = "File is empty";
            log.warn("[LOCAL_IMAGE_UPLOAD_FAILED] Reason: {}", msg);
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", msg));
        }

        // Validate max size (10MB)
        if (file.getSize() > 10 * 1024 * 1024) {
            String msg = "File size exceeds limit of 10MB";
            log.warn("[LOCAL_IMAGE_UPLOAD_FAILED] Reason: {}", msg);
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", msg));
        }

        // Validate MIME type and extension
        String ext = "";
        int dotIdx = originalFilename.lastIndexOf('.');
        if (dotIdx > 0) {
            ext = originalFilename.substring(dotIdx + 1).toLowerCase();
        }

        List<String> allowedExts = Arrays.asList("jpg", "jpeg", "png", "webp", "gif");
        if (!allowedExts.contains(ext)) {
            String msg = "Unsupported file extension: " + ext;
            log.warn("[LOCAL_IMAGE_UPLOAD_FAILED] Reason: {}", msg);
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", msg));
        }

        String contentType = file.getContentType();
        if (contentType != null) {
            String mime = contentType.toLowerCase();
            if (!mime.startsWith("image/") || (!mime.contains("jpeg") && !mime.contains("jpg") && !mime.contains("png") && !mime.contains("webp") && !mime.contains("gif"))) {
                String msg = "Unsupported MIME type: " + mime;
                log.warn("[LOCAL_IMAGE_UPLOAD_FAILED] Reason: {}", msg);
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", msg));
            }
        }

        try {
            Path uploadDir = getUploadDir();
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            // Generate safe unique filename
            String uuid = UUID.randomUUID().toString();
            long timestamp = System.currentTimeMillis();
            String filename = "local_img_" + timestamp + "_" + uuid + "." + ext;

            // Prevent path traversal
            if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
                String msg = "Filename path traversal check failed";
                log.warn("[LOCAL_IMAGE_UPLOAD_FAILED] Reason: {}", msg);
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", msg));
            }

            Path targetPath = uploadDir.resolve(filename).normalize();
            if (!targetPath.getParent().equals(uploadDir.normalize())) {
                String msg = "Target path parent check failed";
                log.warn("[LOCAL_IMAGE_UPLOAD_FAILED] Reason: {}", msg);
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", msg));
            }

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String url = "http://localhost:8080/api/local-image/" + filename;
            log.info("[LOCAL_IMAGE_UPLOAD_SUCCESS] Filename: {}, URL: {}", filename, url);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("url", url);
            response.put("filename", filename);

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("[LOCAL_IMAGE_UPLOAD_FAILED] Exception during upload", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", "Could not store file: " + e.getMessage()));
        }
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> serveImage(@PathVariable String filename) {
        log.info("[LOCAL_IMAGE_SERVE] Filename: {}", filename);

        // Prevent path traversal
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            log.warn("[LOCAL_IMAGE_NOT_FOUND] Path traversal detected: {}", filename);
            return ResponseEntity.notFound().build();
        }

        try {
            Path uploadDir = getUploadDir();
            Path file = uploadDir.resolve(filename).normalize();
            if (!file.getParent().equals(uploadDir.normalize())) {
                log.warn("[LOCAL_IMAGE_NOT_FOUND] Path traversal detected (parent mismatch): {}", filename);
                return ResponseEntity.notFound().build();
            }

            if (!Files.exists(file) || !Files.isReadable(file)) {
                log.warn("[LOCAL_IMAGE_NOT_FOUND] File does not exist or not readable: {}", filename);
                return ResponseEntity.notFound().build();
            }

            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(file);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .body(resource);
            } else {
                log.warn("[LOCAL_IMAGE_NOT_FOUND] Resource exists but is not readable: {}", filename);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("[LOCAL_IMAGE_NOT_FOUND] Exception serving file: {}", filename, e);
            return ResponseEntity.notFound().build();
        }
    }
}
