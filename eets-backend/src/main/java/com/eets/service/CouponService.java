package com.eets.service;

import com.eets.domain.*;
import com.eets.dto.request.ValidateCouponRequest;
import com.eets.dto.response.*;
import com.eets.exception.BadRequestException;
import com.eets.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CouponService {
    private final CouponRepository coupons;
    private final CouponUsageRepository usage;
    private final OrderRepository orders;

    public List<CouponResponse> listVisible(Long userId) {
        Instant now = Instant.now();
        return coupons.findByIsActiveTrueAndValidUntilAfter(now).stream().map(this::toDto).toList();
    }

    public ValidateCouponResponse validate(Long userId, ValidateCouponRequest req) {
        Coupon c = coupons.findByCodeIgnoreCase(req.code()).orElse(null);
        if (c == null) return new ValidateCouponResponse(false, BigDecimal.ZERO, "Coupon not found");
        if (!Boolean.TRUE.equals(c.getIsActive())) return new ValidateCouponResponse(false, BigDecimal.ZERO, "Coupon inactive");
        Instant now = Instant.now();
        if (c.getValidFrom() != null && now.isBefore(c.getValidFrom()))
            return new ValidateCouponResponse(false, BigDecimal.ZERO, "Coupon not yet valid");
        if (c.getValidUntil() != null && now.isAfter(c.getValidUntil()))
            return new ValidateCouponResponse(false, BigDecimal.ZERO, "Coupon expired");
        if (c.getMinOrderAmount() != null && req.cartTotal().compareTo(c.getMinOrderAmount()) < 0)
            return new ValidateCouponResponse(false, BigDecimal.ZERO, "Minimum order ₹" + c.getMinOrderAmount());
        if (c.getApplicableRestaurantId() != null && !c.getApplicableRestaurantId().equals(req.restaurantId()))
            return new ValidateCouponResponse(false, BigDecimal.ZERO, "Coupon not valid for this restaurant");
        long userUsage = usage.countByCouponIdAndUserId(c.getId(), userId);
        if (c.getUsageLimitPerUser() != null && userUsage >= c.getUsageLimitPerUser())
            return new ValidateCouponResponse(false, BigDecimal.ZERO, "Per-user limit reached");
        if (c.getTotalUsageLimit() != null && c.getCurrentUsage() >= c.getTotalUsageLimit())
            return new ValidateCouponResponse(false, BigDecimal.ZERO, "Coupon fully used");
        BigDecimal discount = calculateDiscount(c, req.cartTotal());
        return new ValidateCouponResponse(true, discount, "Coupon applied");
    }

    public BigDecimal calculateDiscount(Coupon c, BigDecimal cartTotal) {
        BigDecimal d = BigDecimal.ZERO;
        switch (c.getType()) {
            case PERCENTAGE -> {
                d = cartTotal.multiply(c.getValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                if (c.getMaxDiscount() != null && d.compareTo(c.getMaxDiscount()) > 0) d = c.getMaxDiscount();
            }
            case FLAT -> d = c.getValue();
            case FREE_DELIVERY -> d = BigDecimal.ZERO;
            case BOGO -> d = cartTotal.multiply(new BigDecimal("0.5")).setScale(2, RoundingMode.HALF_UP);
        }
        return d;
    }

    public Coupon findOrThrow(String code) {
        return coupons.findByCodeIgnoreCase(code).orElseThrow(() -> new BadRequestException("Coupon not found"));
    }

    public Coupon byId(Long id) { return coupons.findById(id).orElse(null); }

    public CouponResponse toDto(Coupon c) {
        return new CouponResponse(c.getId(), c.getCode(), c.getType(), c.getValue(),
            c.getMaxDiscount(), c.getMinOrderAmount(), c.getValidFrom(), c.getValidUntil(),
            c.getIsActive(), c.getApplicableRestaurantId());
    }

    public void recordUsage(Coupon c, Long userId, Long orderId, BigDecimal discount) {
        usage.save(CouponUsage.builder().couponId(c.getId()).userId(userId).orderId(orderId).discountApplied(discount).build());
        c.setCurrentUsage((c.getCurrentUsage() == null ? 0 : c.getCurrentUsage()) + 1);
        coupons.save(c);
    }
}
