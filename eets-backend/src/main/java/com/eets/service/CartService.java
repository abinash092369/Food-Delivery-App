package com.eets.service;

import com.eets.domain.*;
import com.eets.dto.request.*;
import com.eets.dto.response.*;
import com.eets.exception.*;
import com.eets.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class CartService {
    private static final BigDecimal TAX_RATE = new BigDecimal("0.18");

    private final CartRepository carts;
    private final CartItemRepository cartItems;
    private final MenuItemRepository menuItems;
    private final MenuCustomizationOptionRepository options;
    private final RestaurantRepository restaurants;
    private final CouponService couponService;
    private final ObjectMapper json = new ObjectMapper();

    public CartResponse getCart(Long userId) {
        Cart cart = carts.findByUserId(userId).orElse(null);
        if (cart == null) return emptyCart();
        return buildResponse(cart);
    }

    public CartResponse addItem(Long userId, AddToCartRequest req) {
        MenuItem item = menuItems.findById(req.menuItemId())
            .orElseThrow(() -> new ResourceNotFoundException("Menu item not found"));
        if (!Boolean.TRUE.equals(item.getIsAvailable())) throw new BadRequestException("Item unavailable");

        Cart cart = carts.findByUserId(userId).orElseGet(() ->
            carts.save(Cart.builder().userId(userId).restaurantId(item.getRestaurantId()).build()));

        if (cart.getRestaurantId() != null && !cart.getRestaurantId().equals(item.getRestaurantId())) {
            cartItems.deleteByCartId(cart.getId());
            cart.setRestaurantId(item.getRestaurantId());
            cart.setCouponId(null);
            carts.save(cart);
        }
        if (cart.getRestaurantId() == null) { cart.setRestaurantId(item.getRestaurantId()); carts.save(cart); }

        BigDecimal optionsTotal = BigDecimal.ZERO;
        if (req.selectedOptions() != null) {
            List<Long> optIds = req.selectedOptions().stream().map(AddToCartRequest.SelectedOption::optionId).toList();
            for (Long id : optIds) {
                MenuCustomizationOption o = options.findById(id).orElse(null);
                if (o != null) optionsTotal = optionsTotal.add(o.getExtraPrice());
            }
        }
        BigDecimal itemPrice = item.getPrice().add(optionsTotal);
        BigDecimal totalPrice = itemPrice.multiply(BigDecimal.valueOf(req.quantity()));

        CartItem ci = CartItem.builder()
            .cartId(cart.getId()).menuItemId(item.getId()).quantity(req.quantity())
            .selectedOptions(toJson(req.selectedOptions()))
            .itemPrice(itemPrice).totalPrice(totalPrice).build();
        cartItems.save(ci);
        return buildResponse(cart);
    }

    public CartResponse updateItem(Long userId, Long itemId, UpdateCartItemRequest req) {
        Cart cart = carts.findByUserId(userId).orElseThrow(() -> new BadRequestException("Cart empty"));
        CartItem ci = cartItems.findById(itemId).orElseThrow(() -> new ResourceNotFoundException("Item not in cart"));
        if (!ci.getCartId().equals(cart.getId())) throw new ResourceNotFoundException("Item not in cart");
        if (req.quantity() == 0) { cartItems.delete(ci); }
        else {
            ci.setQuantity(req.quantity());
            ci.setTotalPrice(ci.getItemPrice().multiply(BigDecimal.valueOf(req.quantity())));
            cartItems.save(ci);
        }
        List<CartItem> remaining = cartItems.findByCartId(cart.getId());
        if (remaining.isEmpty()) { cart.setRestaurantId(null); cart.setCouponId(null); carts.save(cart); }
        return buildResponse(cart);
    }

    public void clearCart(Long userId) {
        carts.findByUserId(userId).ifPresent(c -> {
            cartItems.deleteByCartId(c.getId());
            c.setRestaurantId(null); c.setCouponId(null);
            carts.save(c);
        });
    }

    public CartResponse applyCoupon(Long userId, ApplyCouponRequest req) {
        Cart cart = carts.findByUserId(userId).orElseThrow(() -> new BadRequestException("Cart empty"));
        Coupon c = couponService.findOrThrow(req.code());
        cart.setCouponId(c.getId());
        carts.save(cart);
        return buildResponse(cart);
    }

    public CartResponse removeCoupon(Long userId) {
        Cart cart = carts.findByUserId(userId).orElseThrow(() -> new BadRequestException("Cart empty"));
        cart.setCouponId(null);
        carts.save(cart);
        return buildResponse(cart);
    }

    public CartResponse buildResponse(Cart cart) {
        List<CartItem> its = cartItems.findByCartId(cart.getId());
        BigDecimal subtotal = its.stream().map(CartItem::getTotalPrice).reduce(BigDecimal.ZERO, BigDecimal::add);
        Restaurant r = cart.getRestaurantId() == null ? null : restaurants.findById(cart.getRestaurantId()).orElse(null);
        // FIX: guard against null deliveryFee (caused by Lombok @Builder bypassing field initializer on existing rows)
        BigDecimal deliveryFee = (r == null || r.getDeliveryFee() == null) ? BigDecimal.ZERO : r.getDeliveryFee();
        BigDecimal tax = subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal discount = BigDecimal.ZERO;
        String code = null;
        if (cart.getCouponId() != null) {
            Coupon c = couponService.byId(cart.getCouponId());
            if (c != null) {
                code = c.getCode();
                discount = couponService.calculateDiscount(c, subtotal);
                if (c.getType() == CouponType.FREE_DELIVERY) deliveryFee = BigDecimal.ZERO;
            }
        }
        BigDecimal total = subtotal.add(deliveryFee).add(tax).subtract(discount).max(BigDecimal.ZERO);

        List<CartItemResponse> dtoItems = its.stream().map(ci -> {
            MenuItem mi = menuItems.findById(ci.getMenuItemId()).orElse(null);
            return new CartItemResponse(ci.getId(), ci.getMenuItemId(),
                mi == null ? "Item" : mi.getName(),
                mi == null ? null : mi.getImageUrl(),
                ci.getQuantity(), ci.getItemPrice(), ci.getTotalPrice(), ci.getSelectedOptions());
        }).toList();

        return new CartResponse(cart.getId(), cart.getRestaurantId(),
            r == null ? null : r.getName(), dtoItems, subtotal, deliveryFee, tax, discount, total, code);
    }

    private CartResponse emptyCart() {
        return new CartResponse(null, null, null, List.of(),
            BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, null);
    }

    public CartResponse removeItem(Long userId, Long itemId) {
        Cart cart = carts.findByUserId(userId).orElseThrow(() -> new BadRequestException("Cart empty"));
        CartItem ci = cartItems.findById(itemId).orElseThrow(() -> new ResourceNotFoundException("Item not in cart"));
        if (!ci.getCartId().equals(cart.getId())) throw new ResourceNotFoundException("Item not in cart");
        cartItems.delete(ci);
        List<CartItem> remaining = cartItems.findByCartId(cart.getId());
        if (remaining.isEmpty()) { cart.setRestaurantId(null); cart.setCouponId(null); carts.save(cart); }
        return buildResponse(cart);
    }

    private String toJson(Object o) {
        if (o == null) return null;
        try { return json.writeValueAsString(o); } catch (Exception e) { return null; }
    }
}