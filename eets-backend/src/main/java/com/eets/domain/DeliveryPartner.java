package com.eets.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "delivery_partners")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DeliveryPartner extends Auditable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type")
    private VehicleType vehicleType;

    @Column(name = "vehicle_make", length = 60)
    private String vehicleMake;
    @Column(name = "vehicle_model", length = 60)
    private String vehicleModel;
    @Column(name = "vehicle_reg_number", length = 30)
    private String vehicleRegNumber;

    @Column(name = "aadhaar_front_url", length = 500)
    private String aadhaarFrontUrl;
    @Column(name = "aadhaar_back_url", length = 500)
    private String aadhaarBackUrl;
    @Column(name = "license_url", length = 500)
    private String licenseUrl;
    @Column(name = "rc_url", length = 500)
    private String rcUrl;
    @Column(name = "selfie_url", length = 500)
    private String selfieUrl;

    @Column(name = "bank_account_number", length = 40)
    private String bankAccountNumber;
    @Column(name = "bank_ifsc", length = 20)
    private String bankIfsc;
    @Column(name = "upi_id", length = 80)
    private String upiId;

    @Column(name = "is_verified")
    private Boolean isVerified = false;
    @Column(name = "is_online")
    private Boolean isOnline = false;

    @Column(name = "current_lat")
    private Double currentLat;
    @Column(name = "current_lng")
    private Double currentLng;

    @Column(name = "total_deliveries")
    private Integer totalDeliveries = 0;
    @Column(name = "avg_rating")
    private Double avgRating = 0.0;
    @Column(name = "total_ratings")
    private Integer totalRatings = 0;

    @Builder.Default
    @Column(name = "operating_radius_km")
    private Double operatingRadiusKm = 10.0;

    @Builder.Default
    @Column(name = "acceptance_rate")
    private Double acceptanceRate = 1.0;

    @Builder.Default
    @Column(name = "completion_rate")
    private Double completionRate = 1.0;
}
