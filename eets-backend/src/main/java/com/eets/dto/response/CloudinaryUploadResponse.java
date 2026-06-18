package com.eets.dto.response;

import java.util.Map;

/**
 * Response returned after a successful server-side Cloudinary upload.
 *
 * @param publicId    Cloudinary public_id (needed for future deletes/replacements)
 * @param secureUrl   HTTPS URL of the uploaded image
 * @param url         HTTP URL (prefer secureUrl in production)
 * @param format      file format, e.g. "jpg", "webp"
 * @param bytes       file size in bytes
 * @param width       pixel width
 * @param height      pixel height
 * @param folder      the Cloudinary folder it was stored in
 * @param assetId     stable asset id across renames/moves
 */
public record CloudinaryUploadResponse(
        String publicId,
        String secureUrl,
        String url,
        String format,
        Long   bytes,
        int    width,
        int    height,
        String folder,
        String assetId
) {
    /** Build from the raw map returned by the Cloudinary Java SDK. */
    public static CloudinaryUploadResponse fromMap(Map<String, Object> m) {
        return new CloudinaryUploadResponse(
                str(m, "public_id"),
                str(m, "secure_url"),
                str(m, "url"),
                str(m, "format"),
                m.get("bytes") == null ? null : ((Number) m.get("bytes")).longValue(),
                m.get("width")  == null ? 0    : ((Number) m.get("width")).intValue(),
                m.get("height") == null ? 0    : ((Number) m.get("height")).intValue(),
                str(m, "folder"),
                str(m, "asset_id")
        );
    }

    private static String str(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v == null ? null : v.toString();
    }
}
