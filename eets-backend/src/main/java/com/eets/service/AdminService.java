package com.eets.service;

import com.eets.domain.*;
import com.eets.dto.request.*;
import com.eets.dto.response.*;
import com.eets.exception.*;
import com.eets.repository.*;
import com.eets.util.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {
    private final UserRepository users;
    private final RestaurantRepository restaurants;
    private final DeliveryPartnerRepository drivers;
    private final OrderRepository orders;
    private final FraudFlagRepository fraudFlags;
    private final CouponRepository coupons;
    private final EmailService emailService;
    private final RestaurantService restaurantService;
    private final OrderService orderService;
    private final CacheService cacheService;
    private final FraudService fraudService;
    private final FraudAuditLogRepository fraudAuditLogs;
    private final FraudThresholdService fraudThresholds;

    // ----- Users -----
    public PageResponse<AdminUserResponse> listUsers(int page, int size, Role role, String q) {
        return PageResponse.of(users.search(q, role, PageRequest.of(page, size)).map(this::toUserDto));
    }
    public AdminUserResponse getUser(Long id) {
        return toUserDto(users.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found")));
    }
    public AdminUserResponse updateUser(Long id, AdminUserUpdateRequest req) {
        User u = users.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        if (req.name() != null) u.setName(req.name());
        if (req.email() != null) u.setEmail(req.email());
        if (req.isActive() != null) u.setIsActive(req.isActive());
        return toUserDto(users.save(u));
    }
    public void banUser(Long id, String reason) {
        User u = users.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        u.setIsBanned(true); u.setIsActive(false); u.setBanReason(reason);
        users.save(u);
        emailService.sendBanNotice(u, reason);
    }

    // ----- Restaurants -----
    public PageResponse<RestaurantDetailResponse> listRestaurants(int page, int size, String q) {
        return PageResponse.of(restaurants.searchAdmin(q, PageRequest.of(page, size)).map(restaurantService::toDetail));
    }
    public List<RestaurantDetailResponse> pendingRestaurants() {
        return restaurants.findByIsApprovedFalseAndRejectionReasonIsNull(PageRequest.of(0, 100))
            .map(restaurantService::toDetail).getContent();
    }
    public void approveRestaurant(Long id) {
        Restaurant r = restaurants.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        r.setIsApproved(true);
        r.setRejectionReason(null);
        restaurants.save(r);
        cacheService.evictRestaurant(r.getSlug());
        users.findById(r.getOwnerId()).ifPresent(v -> emailService.sendRestaurantApproved(v, r));
    }
    public void rejectRestaurant(Long id, String reason) {
        Restaurant r = restaurants.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        r.setIsApproved(false);
        r.setRejectionReason(reason);
        restaurants.save(r);
        cacheService.evictRestaurant(r.getSlug());
        users.findById(r.getOwnerId()).ifPresent(v -> emailService.sendRestaurantRejected(v, r, reason));
    }
    public void setRestaurantStatus(Long id, String status) {
        Restaurant r = restaurants.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        r.setIsActive("ACTIVE".equalsIgnoreCase(status));
        restaurants.save(r);
        cacheService.evictRestaurant(r.getSlug());
    }

    // ----- Drivers -----
    public PageResponse<DriverProfileResponse> listDrivers(int page, int size, DriverService driverService) {
        return PageResponse.of(drivers.findAll(PageRequest.of(page, size)).map(d -> {
            User u = users.findById(d.getUserId()).orElseThrow();
            return driverService.toDto(d, u);
        }));
    }
    public void verifyDriver(Long driverId) {
        DeliveryPartner d = drivers.findById(driverId).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        d.setIsVerified(true);
        drivers.save(d);
    }
    public void rejectDriver(Long driverId) {
        DeliveryPartner d = drivers.findById(driverId).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        d.setIsVerified(false);
        drivers.save(d);
    }

    // ----- Orders -----
    public PageResponse<OrderResponse> listOrders(int page, int size, OrderStatus status) {
        var pageable = PageRequest.of(page, size);
        Page<Order> pageResult = status == null
            ? orders.findAll(pageable)
            : orders.findByStatusOrderByCreatedAtDesc(status, pageable);
        List<Long> ids = pageResult.getContent().stream().map(Order::getId).toList();
        List<OrderResponse> content = orderService.toDtoList(ids);
        Page<OrderResponse> mapped = new org.springframework.data.domain.PageImpl<>(content, pageResult.getPageable(), pageResult.getTotalElements());
        return PageResponse.of(mapped);
    }
    public OrderResponse setOrderNotes(Long id, String notes) {
        Order o = orders.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        o.setAdminNotes(notes);
        return orderService.toDto(orders.save(o));
    }

    // ----- Fraud -----
    public PageResponse<FraudFlagResponse> listFlags(int page, int size, FraudStatus status) {
        var pageable = PageRequest.of(page, size);
        var pageResult = status == null
            ? fraudFlags.findAll(pageable).map(this::toFlag)
            : fraudFlags.findByStatus(status, pageable).map(this::toFlag);
        return PageResponse.of(pageResult);
    }
    public void resolveFlag(Long id, FraudStatus status) {
        FraudFlag f = fraudFlags.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        f.setStatus(status);
        fraudFlags.save(f);
        fraudService.recalculateUserRiskScore(f.getUserId());
    }
    public void blockUser(Long userId, String reason, String adminEmail) {
        banUser(userId, reason);
        fraudAuditLogs.save(FraudAuditLog.builder()
            .action("USER_BLOCKED")
            .performedBy(adminEmail)
            .targetType("USER")
            .targetId(userId)
            .details("Blocked user with reason: " + reason)
            .build());
    }
    public void blockDriver(Long driverId, String reason, String adminEmail) {
        DeliveryPartner d = drivers.findById(driverId).orElseThrow(() -> new ResourceNotFoundException("Driver not found"));
        d.setIsVerified(false);
        d.setIsOnline(false);
        drivers.save(d);
        banUser(d.getUserId(), reason);
        fraudAuditLogs.save(FraudAuditLog.builder()
            .action("DRIVER_BLOCKED")
            .performedBy(adminEmail)
            .targetType("DRIVER")
            .targetId(driverId)
            .details("Blocked driver (userId=" + d.getUserId() + ") with reason: " + reason)
            .build());
    }
    public Map<String, Object> getFraudStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalOpenFlags", fraudFlags.countByStatus(FraudStatus.OPEN));
        stats.put("totalInvestigatedFlags", fraudFlags.countByStatus(FraudStatus.INVESTIGATED));
        stats.put("totalDismissedFlags", fraudFlags.countByStatus(FraudStatus.DISMISSED));

        Map<String, Long> byType = new HashMap<>();
        for (Object[] row : fraudFlags.countFlagsByType()) {
            byType.put((String) row[0], (Long) row[1]);
        }
        stats.put("flagsByType", byType);

        Map<String, Long> riskScores = new HashMap<>();
        for (FraudRiskScore score : FraudRiskScore.values()) {
            riskScores.put(score.name(), users.countByFraudRiskScore(score));
        }
        stats.put("riskScores", riskScores);

        stats.put("blockedUsersCount", users.countByIsBannedTrue());
        stats.put("blockedDriversCount", users.countByRoleAndIsBannedTrue(Role.DRIVER));
        return stats;
    }
    public PageResponse<FraudAuditLog> listAuditLogs(
            int page, int size, String action, String targetType, Long targetId, Instant startDate, Instant endDate) {
        org.springframework.data.jpa.domain.Specification<FraudAuditLog> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (action != null && !action.isBlank()) {
                predicates.add(cb.equal(root.get("action"), action));
            }
            if (targetType != null && !targetType.isBlank()) {
                predicates.add(cb.equal(root.get("targetType"), targetType));
            }
            if (targetId != null) {
                predicates.add(cb.equal(root.get("targetId"), targetId));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        PageRequest pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        return PageResponse.of(fraudAuditLogs.findAll(spec, pageable));
    }

    // ----- Coupons -----
    public CouponResponse createCoupon(Long createdById, CouponCreateRequest req, CouponService couponService) {
        Coupon c = Coupon.builder().code(req.code().toUpperCase()).type(req.type()).value(req.value())
            .maxDiscount(req.maxDiscount()).minOrderAmount(req.minOrderAmount() == null ? java.math.BigDecimal.ZERO : req.minOrderAmount())
            .usageLimitPerUser(req.usageLimitPerUser() == null ? 1 : req.usageLimitPerUser())
            .totalUsageLimit(req.totalUsageLimit()).validFrom(req.validFrom() == null ? Instant.now() : req.validFrom())
            .validUntil(req.validUntil()).isActive(true).applicableRestaurantId(req.applicableRestaurantId())
            .createdById(createdById).build();
        c = coupons.save(c);
        cacheService.evictAnalytics();
        return couponService.toDto(c);
    }
    public PageResponse<CouponResponse> listCoupons(int page, int size, CouponService couponService) {
        return PageResponse.of(coupons.findAll(PageRequest.of(page, size)).map(couponService::toDto));
    }
    public void deleteCoupon(Long id) {
        Coupon c = coupons.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        c.setIsActive(false);
        coupons.save(c);
        cacheService.evictAnalytics();
    }

    private AdminUserResponse toUserDto(User u) {
        return new AdminUserResponse(u.getId(), u.getName(), u.getEmail(), u.getPhone(), u.getRole(),
            u.getIsActive(), u.getIsBanned(), u.getBanReason(), u.getLastLoginAt(), u.getCreatedAt());
    }
    private FraudFlagResponse toFlag(FraudFlag f) {
        return new FraudFlagResponse(f.getId(), f.getUserId(), f.getOrderId(), f.getFlagType(),
            f.getRiskScore(), f.getDetails(), f.getStatus(), f.getFlaggedAt());
    }
}
