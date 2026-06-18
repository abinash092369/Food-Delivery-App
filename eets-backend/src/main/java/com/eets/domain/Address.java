package com.eets.domain;
 
import jakarta.persistence.*;
import lombok.*;
 
@Entity
@Table(name = "addresses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Address extends Auditable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @Column(name = "user_id", nullable = false)
    private Long userId;
 
    @Enumerated(EnumType.STRING)
    private AddressLabel label = AddressLabel.HOME;
 
    @Column(name = "address_line")
    private String addressLine;
    private String city;
    private String state;
    private String pincode;
    private Double lat;
    private Double lng;
 
    @Column(name = "is_default")
    private Boolean isDefault = false;
 
    @Column(name = "is_deleted", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean isDeleted = false;
}