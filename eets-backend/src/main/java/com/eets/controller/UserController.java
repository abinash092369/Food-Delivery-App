package com.eets.controller;

import com.eets.dto.request.*;
import com.eets.dto.response.*;
import com.eets.security.CurrentUser;
import com.eets.service.UserService;
import com.eets.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService users;

    @GetMapping("/me")
    public ApiResponse<UserResponse> me() { return ApiResponse.ok(users.getMe(CurrentUser.id())); }
    @PutMapping("/me")
    public ApiResponse<UserResponse> updateMe(@Valid @RequestBody UpdateProfileRequest req) {
        return ApiResponse.ok(users.updateMe(CurrentUser.id(), req));
    }
    @GetMapping("/me/addresses")
    public ApiResponse<List<AddressResponse>> addresses() { return ApiResponse.ok(users.listAddresses(CurrentUser.id())); }
    @PostMapping("/me/addresses")
    public ApiResponse<AddressResponse> addAddress(@Valid @RequestBody AddressRequest req) {
        return ApiResponse.ok(users.addAddress(CurrentUser.id(), req));
    }
    @PutMapping("/me/addresses/{id}")
    public ApiResponse<AddressResponse> updateAddress(@PathVariable Long id, @Valid @RequestBody AddressRequest req) {
        return ApiResponse.ok(users.updateAddress(CurrentUser.id(), id, req));
    }
    @DeleteMapping("/me/addresses/{id}")
    public ApiResponse<Map<String, String>> deleteAddress(@PathVariable Long id) {
        users.deleteAddress(CurrentUser.id(), id);
        return ApiResponse.ok(Map.of("status", "deleted"));
    }
    @GetMapping("/me/favorites")
    public ApiResponse<Map<String, Object>> favorites() { return ApiResponse.ok(users.listFavorites(CurrentUser.id())); }
    @PostMapping("/me/favorites")
    public ApiResponse<Map<String, Boolean>> toggleFavorite(@Valid @RequestBody FavoriteRequest req) {
        return ApiResponse.ok(users.toggleFavorite(CurrentUser.id(), req));
    }
    @GetMapping("/me/notification-preferences")
    public ApiResponse<NotificationPrefResponse> prefs() { return ApiResponse.ok(users.getPrefs(CurrentUser.id())); }
    @PutMapping("/me/notification-preferences")
    public ApiResponse<NotificationPrefResponse> updatePrefs(@Valid @RequestBody NotificationPrefRequest req) {
        return ApiResponse.ok(users.updatePrefs(CurrentUser.id(), req));
    }
}
