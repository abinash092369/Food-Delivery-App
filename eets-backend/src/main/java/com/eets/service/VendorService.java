package com.eets.service;

import com.eets.domain.*;
import com.eets.dto.request.*;
import com.eets.dto.response.*;
import com.eets.exception.*;
import com.eets.repository.*;
import com.eets.util.PageResponse;
import com.eets.util.SlugUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class VendorService {
    private final UserRepository users;
    private final RestaurantRepository restaurants;
    private final MenuCategoryRepository categories;
    private final MenuItemRepository items;
    private final MenuCustomizationGroupRepository groups;
    private final MenuCustomizationOptionRepository options;
    private final OrderRepository orders;
    private final ReviewRepository reviews;
    private final PromotionRepository promotions;
    private final PasswordEncoder encoder;
    private final MenuService menuService;
    private final OrderService orderService;
    private final ReviewService reviewService;
    private final CacheService cacheService;
    private final ObjectMapper json = new ObjectMapper();

    public Map<String, Object> register(VendorRegisterRequest req) {
        if (users.existsByEmail(req.email())) throw new BadRequestException("Email already exists");
        User vendor = users.save(User.builder().name(req.name()).email(req.email()).phone(req.phone())
            .passwordHash(encoder.encode(req.password())).role(Role.VENDOR).isActive(true).build());
        String slug = SlugUtil.slugify(req.restaurantName()) + "-" + System.currentTimeMillis() % 100000;
        Restaurant r = Restaurant.builder().ownerId(vendor.getId()).name(req.restaurantName())
            .slug(slug).description(req.description())
            .cuisineTypes(toJson(req.cuisineTypes())).coverImageUrl(req.coverImageUrl()).logoUrl(req.logoUrl())
            .addressLine(req.addressLine()).city(req.city()).state(req.state()).pincode(req.pincode())
            .lat(req.lat()).lng(req.lng()).fssaiLicense(req.fssaiLicense()).gstNumber(req.gstNumber())
            .isApproved(false).isActive(true).build();
        restaurants.save(r);
        return Map.of("userId", vendor.getId(), "restaurantId", r.getId(),
            "message", "Registration submitted. Pending admin approval.");
    }

    public Restaurant myRestaurant(Long vendorUserId) {
        return restaurants.findByOwnerId(vendorUserId)
            .orElseThrow(() -> new ResourceNotFoundException("No restaurant for this vendor"));
    }

    public RestaurantDetailResponse getMyRestaurant(Long vendorUserId, RestaurantService restaurantService) {
        return restaurantService.toDetail(myRestaurant(vendorUserId));
    }

    public RestaurantDetailResponse updateMyRestaurant(Long vendorUserId, RestaurantUpdateRequest req,
                                                       RestaurantService restaurantService) {
        Restaurant r = myRestaurant(vendorUserId);
        if (req.name() != null) r.setName(req.name());
        if (req.description() != null) r.setDescription(req.description());
        if (req.cuisineTypes() != null) r.setCuisineTypes(toJson(req.cuisineTypes()));
        if (req.coverImageUrl() != null) r.setCoverImageUrl(req.coverImageUrl());
        if (req.logoUrl() != null) r.setLogoUrl(req.logoUrl());
        if (req.addressLine() != null) r.setAddressLine(req.addressLine());
        if (req.city() != null) r.setCity(req.city());
        if (req.state() != null) r.setState(req.state());
        if (req.pincode() != null) r.setPincode(req.pincode());
        if (req.lat() != null) r.setLat(req.lat());
        if (req.lng() != null) r.setLng(req.lng());
        if (req.minOrderAmount() != null) r.setMinOrderAmount(req.minOrderAmount());
        if (req.deliveryTimeMin() != null) r.setDeliveryTimeMin(req.deliveryTimeMin());
        if (req.deliveryFee() != null) r.setDeliveryFee(req.deliveryFee());
        if (req.openingTime() != null) r.setOpeningTime(req.openingTime());
        if (req.closingTime() != null) r.setClosingTime(req.closingTime());
        if (req.daysOpen() != null) r.setDaysOpen(toJson(req.daysOpen()));
        if (req.isOpen() != null) r.setIsOpen(req.isOpen());
        Restaurant saved = restaurants.save(r);
        cacheService.evictRestaurant(saved.getSlug());
        return restaurantService.toDetail(saved);
    }

    public Map<String, Boolean> setStatus(Long vendorUserId, Boolean targetStatus) {
        Restaurant r = myRestaurant(vendorUserId);
        r.setIsOpen(Boolean.TRUE.equals(targetStatus));
        restaurants.save(r);
        cacheService.evictRestaurant(r.getSlug());
        return Map.of("isOpen", r.getIsOpen());
    }

    // ----- Menu management -----
    public MenuCategoryResponse addCategory(Long vendorUserId, MenuCategoryRequest req) {
        Restaurant r = myRestaurant(vendorUserId);
        MenuCategory c = MenuCategory.builder().restaurantId(r.getId()).name(req.name())
            .description(req.description()).imageUrl(req.imageUrl())
            .sortOrder(req.sortOrder() == null ? 0 : req.sortOrder()).isAvailable(true).build();
        MenuCategory saved = categories.save(c);
        cacheService.evictMenu(r.getId());
        return menuService.toCat(saved);
    }
    public MenuCategoryResponse updateCategory(Long vendorUserId, Long id, MenuCategoryRequest req) {
        MenuCategory c = categories.findById(id).orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        ensureOwns(vendorUserId, c.getRestaurantId());
        if (req.name() != null) c.setName(req.name());
        if (req.description() != null) c.setDescription(req.description());
        if (req.imageUrl() != null) c.setImageUrl(req.imageUrl());
        if (req.sortOrder() != null) c.setSortOrder(req.sortOrder());
        MenuCategory saved = categories.save(c);
        cacheService.evictMenu(c.getRestaurantId());
        return menuService.toCat(saved);
    }
    public void deleteCategory(Long vendorUserId, Long id) {
        MenuCategory c = categories.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        ensureOwns(vendorUserId, c.getRestaurantId());
        categories.delete(c);
        cacheService.evictMenu(c.getRestaurantId());
    }

    public MenuItemResponse addItem(Long vendorUserId, MenuItemRequest req) {
        Restaurant r = myRestaurant(vendorUserId);
        MenuCategory c = categories.findById(req.categoryId()).orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        if (!c.getRestaurantId().equals(r.getId())) throw new UnauthorizedException("Not your category");
        MenuItem mi = MenuItem.builder().restaurantId(r.getId()).categoryId(c.getId())
            .name(req.name()).description(req.description()).price(req.price())
            .isVeg(Boolean.TRUE.equals(req.isVeg())).imageUrl(req.imageUrl())
            .isAvailable(req.isAvailable() == null || req.isAvailable())
            .isFeatured(Boolean.TRUE.equals(req.isFeatured())).build();
        mi = items.save(mi);
        if (req.customizationGroups() != null) {
            int gIdx = 0;
            for (var g : req.customizationGroups()) {
                MenuCustomizationGroup grp = groups.save(MenuCustomizationGroup.builder()
                    .menuItemId(mi.getId()).name(g.name()).type(g.type())
                    .isRequired(Boolean.TRUE.equals(g.isRequired())).sortOrder(gIdx++).build());
                if (g.options() != null) {
                    int oIdx = 0;
                    for (var op : g.options()) {
                        options.save(MenuCustomizationOption.builder()
                            .groupId(grp.getId()).name(op.name())
                            .extraPrice(op.extraPrice() == null ? java.math.BigDecimal.ZERO : op.extraPrice())
                            .sortOrder(oIdx++).build());
                    }
                }
            }
        }
        cacheService.evictMenu(r.getId());
        return menuService.toItem(mi);
    }

    public MenuItemResponse updateItem(Long vendorUserId, Long id, MenuItemRequest req) {
        MenuItem mi = items.findById(id).orElseThrow(() -> new ResourceNotFoundException("Item not found"));
        ensureOwns(vendorUserId, mi.getRestaurantId());
        if (req.name() != null) mi.setName(req.name());
        if (req.description() != null) mi.setDescription(req.description());
        if (req.price() != null) mi.setPrice(req.price());
        if (req.imageUrl() != null) mi.setImageUrl(req.imageUrl());
        if (req.isVeg() != null) mi.setIsVeg(req.isVeg());
        if (req.isAvailable() != null) mi.setIsAvailable(req.isAvailable());
        if (req.isFeatured() != null) mi.setIsFeatured(req.isFeatured());
        if (req.categoryId() != null) mi.setCategoryId(req.categoryId());
        items.save(mi);
        cacheService.evictMenu(mi.getRestaurantId());
        return menuService.toItem(mi);
    }
    public void deleteItem(Long vendorUserId, Long id) {
        MenuItem mi = items.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        ensureOwns(vendorUserId, mi.getRestaurantId());
        items.delete(mi);
        cacheService.evictMenu(mi.getRestaurantId());
    }
    public MenuItemResponse setItemAvailability(Long vendorUserId, Long id, Boolean isAvailable) {
        MenuItem mi = items.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        ensureOwns(vendorUserId, mi.getRestaurantId());
        mi.setIsAvailable(isAvailable);
        MenuItem saved = items.save(mi);
        cacheService.evictMenu(saved.getRestaurantId());
        return menuService.toItem(saved);
    }
    public MenuItemResponse setItemFeatured(Long vendorUserId, Long id, Boolean isFeatured) {
        MenuItem mi = items.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        ensureOwns(vendorUserId, mi.getRestaurantId());
        mi.setIsFeatured(isFeatured);
        MenuItem saved = items.save(mi);
        cacheService.evictMenu(saved.getRestaurantId());
        return menuService.toItem(saved);
    }

    // ----- Orders -----
    public PageResponse<OrderResponse> myOrders(Long vendorUserId, int page, int size) {
        Restaurant r = myRestaurant(vendorUserId);
        return orderService.toDtoPage(orders.findByRestaurantIdOrderByCreatedAtDesc(r.getId(),
            PageRequest.of(page, size)));
    }

    public PageResponse<ReviewResponse> myReviews(Long vendorUserId, int page, int size) {
        Restaurant r = myRestaurant(vendorUserId);
        return reviewService.forVendor(r.getId(), page, size);
    }

    public PromotionResponse addPromotion(Long vendorUserId, PromotionRequest req) {
        Restaurant r = myRestaurant(vendorUserId);
        Promotion p = Promotion.builder().restaurantId(r.getId()).type(req.type()).value(req.value())
            .minOrder(req.minOrder()).applicableTo(req.applicableTo() == null ? ApplicableTo.ALL : req.applicableTo())
            .applicableId(req.applicableId()).bannerUrl(req.bannerUrl()).usageLimit(req.usageLimit())
            .validFrom(req.validFrom()).validUntil(req.validUntil()).isActive(true).build();
        p = promotions.save(p);
        cacheService.evictAnalytics();
        return toPromo(p);
    }
    public List<PromotionResponse> listPromotions(Long vendorUserId) {
        Restaurant r = myRestaurant(vendorUserId);
        return promotions.findByRestaurantId(r.getId()).stream().map(this::toPromo).toList();
    }
    public void deletePromotion(Long vendorUserId, Long id) {
        Promotion p = promotions.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        ensureOwns(vendorUserId, p.getRestaurantId());
        promotions.delete(p);
        cacheService.evictAnalytics();
    }

    private void ensureOwns(Long vendorUserId, Long restaurantId) {
        Restaurant r = restaurants.findById(restaurantId).orElseThrow();
        if (!r.getOwnerId().equals(vendorUserId)) throw new UnauthorizedException("Not your resource");
    }
    private String toJson(Object o) {
        if (o == null) return null;
        try { return json.writeValueAsString(o); } catch (Exception e) { return null; }
    }
    private PromotionResponse toPromo(Promotion p) {
        return new PromotionResponse(p.getId(), p.getType(), p.getValue(), p.getMinOrder(),
            p.getApplicableTo(), p.getApplicableId(), p.getBannerUrl(), p.getUsageLimit(),
            p.getCurrentUsage(), p.getValidFrom(), p.getValidUntil(), p.getIsActive());
    }
}
