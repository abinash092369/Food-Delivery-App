package com.eets.security;

import com.eets.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class CurrentUser {
    private CurrentUser() {}
    public static Long id() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null || a.getPrincipal() == null || "anonymousUser".equals(a.getPrincipal()))
            throw new UnauthorizedException("Not authenticated");
        return (Long) a.getPrincipal();
    }
    public static Long idOrNull() {
        try { return id(); } catch (Exception e) { return null; }
    }
}
