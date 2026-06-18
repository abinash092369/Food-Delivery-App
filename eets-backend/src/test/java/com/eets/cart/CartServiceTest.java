package com.eets.cart;

import com.eets.domain.*;
import com.eets.dto.request.AddToCartRequest;
import com.eets.dto.response.CartResponse;
import com.eets.exception.*;
import com.eets.repository.*;
import com.eets.service.CartService;
import com.eets.service.CouponService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock private CartRepository carts;
    @Mock private CartItemRepository cartItems;
    @Mock private MenuItemRepository menuItems;
    @Mock private MenuCustomizationOptionRepository options;
    @Mock private RestaurantRepository restaurants;
    @Mock private CouponService couponService;

    @InjectMocks
    private CartService cartService;

    @Test
    @DisplayName("addItem(): first item to empty cart -> cart restaurant set")
    void addItem_firstItemToEmptyCart() {
        Long userId = 1L;
        AddToCartRequest req = new AddToCartRequest(100L, 2, Collections.emptyList());
        MenuItem item = MenuItem.builder().id(100L).restaurantId(50L).price(BigDecimal.valueOf(100.00)).isAvailable(true).build();
        Cart cart = Cart.builder().id(10L).userId(userId).restaurantId(null).build();
        Restaurant restaurant = Restaurant.builder().id(50L).name("Pizza").deliveryFee(BigDecimal.valueOf(30.00)).build();

        when(menuItems.findById(100L)).thenReturn(Optional.of(item));
        when(carts.findByUserId(userId)).thenReturn(Optional.of(cart));
        when(restaurants.findById(50L)).thenReturn(Optional.of(restaurant));

        CartResponse resp = cartService.addItem(userId, req);

        assertThat(resp).isNotNull();
        assertThat(cart.getRestaurantId()).isEqualTo(50L);
        verify(carts).save(cart);
        verify(cartItems).save(any(CartItem.class));
    }

    @Test
    @DisplayName("addItem(): item from different restaurant -> existing cart cleared, new restaurant set")
    void addItem_differentRestaurantClearsCart() {
        Long userId = 1L;
        AddToCartRequest req = new AddToCartRequest(100L, 2, Collections.emptyList());
        MenuItem item = MenuItem.builder().id(100L).restaurantId(50L).price(BigDecimal.valueOf(100.00)).isAvailable(true).build();
        Cart cart = Cart.builder().id(10L).userId(userId).restaurantId(60L).build(); // Existing restaurant 60L
        Restaurant restaurant = Restaurant.builder().id(50L).name("Pizza").deliveryFee(BigDecimal.valueOf(30.00)).build();

        when(menuItems.findById(100L)).thenReturn(Optional.of(item));
        when(carts.findByUserId(userId)).thenReturn(Optional.of(cart));
        when(restaurants.findById(50L)).thenReturn(Optional.of(restaurant));

        CartResponse resp = cartService.addItem(userId, req);

        assertThat(resp).isNotNull();
        assertThat(cart.getRestaurantId()).isEqualTo(50L);
        verify(cartItems).deleteByCartId(10L); // Verify existing items deleted
        verify(carts, times(1)).save(cart); // Saved during add/update
    }

    @Test
    @DisplayName("addItem(): item not available -> throws BadRequestException")
    void addItem_itemNotAvailable() {
        Long userId = 1L;
        AddToCartRequest req = new AddToCartRequest(100L, 2, Collections.emptyList());
        MenuItem item = MenuItem.builder().id(100L).isAvailable(false).build(); // Unavailable

        when(menuItems.findById(100L)).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> cartService.addItem(userId, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Item unavailable");
    }

    @Test
    @DisplayName("removeItem(): item not in cart -> throws ResourceNotFoundException")
    void removeItem_itemNotInCart() {
        Long userId = 1L;
        Cart cart = Cart.builder().id(10L).userId(userId).build();

        when(carts.findByUserId(userId)).thenReturn(Optional.of(cart));
        when(cartItems.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cartService.removeItem(userId, 999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Item not in cart");
    }

    @Test
    @DisplayName("clearCart(): cart items deleted, restaurantId reset")
    void clearCart_deletesItemsAndResets() {
        Long userId = 1L;
        Cart cart = Cart.builder().id(10L).userId(userId).restaurantId(50L).build();

        when(carts.findByUserId(userId)).thenReturn(Optional.of(cart));

        cartService.clearCart(userId);

        assertThat(cart.getRestaurantId()).isNull();
        verify(cartItems).deleteByCartId(10L);
        verify(carts).save(cart);
    }
}
