package com.eets.util;

import java.text.Normalizer;
import java.util.Locale;

public final class SlugUtil {
    private SlugUtil() {}
    public static String slugify(String input) {
        if (input == null) return "";
        String nowhitespace = input.trim().toLowerCase(Locale.ROOT).replaceAll("[\\s]+", "-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        return normalized.replaceAll("[^a-z0-9-]", "").replaceAll("-+", "-");
    }
}
