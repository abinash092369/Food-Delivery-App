package com.eets.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Order extends Auditable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, unique = true, length = 40)
    private String orderNumber;

    @Column(name = "user_id", nullable = false)
    private Long userId;
    @Column(name = "restaurant_id", nullable = false)
    private Long restaurantId;
    @Column(name = "delivery_partner_id")
    private Long deliveryPartnerId;
    @Column(name = "delivery_address_id", nullable = false)
    private Long deliveryAddressId;
    @Column(name = "coupon_id")
    private Long couponId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus;

    @Column(name = "razorpay_order_id", length = 100)
    private String razorpayOrderId;
    @Column(name = "razorpay_payment_id", length = 100)
    private String razorpayPaymentId;
    @Column(name = "razorpay_signature", length = 255)
    private String razorpaySignature;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;
    @Column(name = "delivery_fee", nullable = false, precision = 10, scale = 2)
    private BigDecimal deliveryFee;
    @Column(name = "tax_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal taxAmount;
    @Column(name = "discount_amount", precision = 10, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;
    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "special_instructions", length = 500)
    private String specialInstructions;
    @Column(name = "estimated_delivery_at")
    private Instant estimatedDeliveryAt;
    @Column(name = "delivered_at")
    private Instant deliveredAt;
    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;
    @Column(name = "admin_notes", length = 1000)
    private String adminNotes;
    @Column(name = "refund_amount", precision = 10, scale = 2)
    private BigDecimal refundAmount;
    @Column(name = "refund_reason", length = 500)
    private String refundReason;

    @Column(name = "cod_refund_pending")
    @Builder.Default
    private Boolean codRefundPending = false;
}
