package com.eets.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "payouts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Payout extends Auditable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recipient_id", nullable = false)
    private Long recipientId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PayoutType type;

    @Column(name = "period_start")
    private LocalDate periodStart;
    @Column(name = "period_end")
    private LocalDate periodEnd;

    @Column(name = "total_orders")
    private Integer totalOrders;

    @Column(name = "gross_amount", precision = 12, scale = 2)
    private BigDecimal grossAmount;
    @Column(name = "commission_rate", precision = 5, scale = 4)
    private BigDecimal commissionRate;
    @Column(name = "commission_amount", precision = 12, scale = 2)
    private BigDecimal commissionAmount;
    @Column(name = "net_amount", precision = 12, scale = 2)
    private BigDecimal netAmount;

    @Enumerated(EnumType.STRING)
    private PayoutStatus status = PayoutStatus.PENDING;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "transaction_ref", length = 100)
    private String transactionRef;
}
