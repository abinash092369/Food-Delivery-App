package com.eets.service;
 
import com.eets.domain.*;
import com.eets.dto.request.*;
import com.eets.dto.response.*;
import com.eets.exception.ResourceNotFoundException;
import com.eets.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
 
import java.util.*;
 
@Service
@RequiredArgsConstructor
@Transactional
public class UserService {
    private final UserRepository users;
    private final AddressRepository addresses;
    private final UserFavoriteRepository favorites;
    private final NotificationPreferenceRepository prefs;
    private final AuthService authService;
 
    public UserResponse getMe(Long userId) {
        User u = users.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return authService.toUserResponse(u);
    }
 
    public UserResponse updateMe(Long userId, UpdateProfileRequest req) {
        User u = users.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (req.name() != null) u.setName(req.name());
        if (req.email() != null) u.setEmail(req.email());
        if (req.profileImageUrl() != null) u.setProfileImageUrl(req.profileImageUrl());
        if (req.phone() != null) u.setPhone(req.phone());
        return authService.toUserResponse(users.save(u));
    }
 
    public List<AddressResponse> listAddresses(Long userId) {
        return addresses.findByUserIdAndIsDeletedFalse(userId).stream().map(this::toAddr).toList();
    }
 
    public AddressResponse addAddress(Long userId, AddressRequest req) {
        if (Boolean.TRUE.equals(req.isDefault())) clearDefault(userId);
        Address a = Address.builder().userId(userId).label(req.label())
            .addressLine(req.addressLine()).city(req.city()).state(req.state())
            .pincode(req.pincode()).lat(req.lat()).lng(req.lng())
            .isDefault(Boolean.TRUE.equals(req.isDefault())).isDeleted(false).build();
        return toAddr(addresses.save(a));
    }
 
    public AddressResponse updateAddress(Long userId, Long id, AddressRequest req) {
        Address a = addresses.findById(id).orElseThrow(() -> new ResourceNotFoundException("Address not found"));
        if (!a.getUserId().equals(userId)) throw new ResourceNotFoundException("Address not found");
        if (Boolean.TRUE.equals(req.isDefault())) clearDefault(userId);
        a.setLabel(req.label()); a.setAddressLine(req.addressLine()); a.setCity(req.city());
        a.setState(req.state()); a.setPincode(req.pincode()); a.setLat(req.lat()); a.setLng(req.lng());
        a.setIsDefault(Boolean.TRUE.equals(req.isDefault()));
        return toAddr(addresses.save(a));
    }
 
    public void deleteAddress(Long userId, Long id) {
        Address a = addresses.findById(id).orElseThrow(() -> new ResourceNotFoundException("Address not found"));
        if (!a.getUserId().equals(userId)) throw new ResourceNotFoundException("Not found");
        a.setIsDeleted(true);
        addresses.save(a);
    }
 
    private void clearDefault(Long userId) {
        addresses.findByUserIdAndIsDeletedFalse(userId).forEach(a -> { a.setIsDefault(false); addresses.save(a); });
    }
 
    public Map<String, Object> listFavorites(Long userId) {
        List<UserFavorite> all = favorites.findByUserId(userId);
        return Map.of(
            "restaurants", all.stream().filter(f -> f.getType() == FavoriteType.RESTAURANT).map(UserFavorite::getReferenceId).toList(),
            "items", all.stream().filter(f -> f.getType() == FavoriteType.ITEM).map(UserFavorite::getReferenceId).toList()
        );
    }
 
    public Map<String, Boolean> toggleFavorite(Long userId, FavoriteRequest req) {
        var existing = favorites.findByUserIdAndTypeAndReferenceId(userId, req.type(), req.referenceId());
        if (existing.isPresent()) { favorites.delete(existing.get()); return Map.of("isFavorited", false); }
        favorites.save(UserFavorite.builder().userId(userId).type(req.type()).referenceId(req.referenceId()).build());
        return Map.of("isFavorited", true);
    }
 
    public NotificationPrefResponse getPrefs(Long userId) {
        NotificationPreference p = prefs.findByUserId(userId).orElseGet(() ->
            prefs.save(NotificationPreference.builder().userId(userId).build()));
        return new NotificationPrefResponse(p.getPush(), p.getEmail(), p.getSms(), p.getOrderUpdates(), p.getPromotions());
    }
 
    public NotificationPrefResponse updatePrefs(Long userId, NotificationPrefRequest req) {
        NotificationPreference p = prefs.findByUserId(userId).orElseGet(() ->
            NotificationPreference.builder().userId(userId).build());
        if (req.push() != null) p.setPush(req.push());
        if (req.email() != null) p.setEmail(req.email());
        if (req.sms() != null) p.setSms(req.sms());
        if (req.orderUpdates() != null) p.setOrderUpdates(req.orderUpdates());
        if (req.promotions() != null) p.setPromotions(req.promotions());
        p = prefs.save(p);
        return new NotificationPrefResponse(p.getPush(), p.getEmail(), p.getSms(), p.getOrderUpdates(), p.getPromotions());
    }
 
    private AddressResponse toAddr(Address a) {
        return new AddressResponse(a.getId(), a.getLabel(), a.getAddressLine(), a.getCity(),
            a.getState(), a.getPincode(), a.getLat(), a.getLng(), a.getIsDefault());
    }
}