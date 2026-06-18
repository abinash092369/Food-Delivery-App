package com.eets.dto.event;

import com.eets.domain.OrderStatus;
import com.eets.domain.PaymentMethod;
import com.eets.domain.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderEvent {
    private String eventId;
    private Long orderId;
    private String orderNumber;
    private OrderStatus status;
    private Long userId;
    private Long restaurantId;
    private BigDecimal totalAmount;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private Instant timestamp;
}
