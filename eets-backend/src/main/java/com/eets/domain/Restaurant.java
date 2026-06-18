package com.eets.domain;

import com.eets.event.RestaurantEntityListener;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalTime;

@Entity
@Table(name = "restaurants")
@EntityListeners(RestaurantEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Restaurant extends Auditable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(nullable = false, length = 180)
    private String name;

    @Column(nullable = false, unique = true, length = 200)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "cuisine_types", columnDefinition = "json")
    private String cuisineTypes;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "address_line")
    private String addressLine;
    private String city;
    private String state;
    private String pincode;
    private Double lat;
    private Double lng;

    @Builder.Default
    @Column(name = "is_open")
    private Boolean isOpen = true;

    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = true;

    @Builder.Default
    @Column(name = "is_approved")
    private Boolean isApproved = false;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "fssai_license", length = 50)
    private String fssaiLicense;

    @Column(name = "gst_number", length = 50)
    private String gstNumber;

    @Builder.Default
    @Column(name = "avg_rating")
    private Double avgRating = 0.0;

    @Builder.Default
    @Column(name = "total_ratings")
    private Integer totalRatings = 0;

    @Builder.Default
    @Column(name = "min_order_amount", precision = 10, scale = 2)
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "delivery_time_min")
    private Integer deliveryTimeMin = 30;

    @Builder.Default
    @Column(name = "delivery_fee", precision = 10, scale = 2)
    private BigDecimal deliveryFee = BigDecimal.ZERO;

    @Column(name = "opening_time")
    private LocalTime openingTime;

    @Column(name = "closing_time")
    private LocalTime closingTime;

    @Column(name = "days_open", columnDefinition = "json")
    private String daysOpen;

    @Builder.Default
    @Column(name = "delivery_radius_km")
    private Double deliveryRadiusKm = 5.0;
}