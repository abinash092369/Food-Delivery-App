package com.eets.dto.response;

import com.eets.domain.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
public record OrderResponse(Long id, String orderNumber, OrderStatus status, PaymentMethod paymentMethod,
    PaymentStatus paymentStatus, BigDecimal subtotal, BigDecimal deliveryFee, BigDecimal taxAmount,
    BigDecimal discountAmount, BigDecimal totalAmount, String specialInstructions,
    Instant estimatedDeliveryAt, Instant deliveredAt, Instant createdAt,
    Long restaurantId, String restaurantName, String restaurantAddress,
    AddressResponse deliveryAddress, List<OrderItemResponse> items,
    List<OrderStatusHistoryResponse> statusHistory, DriverInfo driver) {
    public record DriverInfo(Long id, String name, String phone, String vehicleType, Double avgRating) {}
}
