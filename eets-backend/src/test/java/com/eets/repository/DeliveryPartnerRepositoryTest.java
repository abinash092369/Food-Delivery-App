package com.eets.repository;

import com.eets.domain.DeliveryPartner;
import com.eets.domain.VehicleType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class DeliveryPartnerRepositoryTest {

    @Autowired
    private DeliveryPartnerRepository deliveryPartnerRepository;

    @Test
    @DisplayName("findByUserId should find the driver partner when userId matches")
    void testFindByUserId() {
        DeliveryPartner partner = DeliveryPartner.builder()
                .userId(15L)
                .vehicleType(VehicleType.BICYCLE)
                .isOnline(true)
                .isVerified(true)
                .avgRating(4.8)
                .build();
        deliveryPartnerRepository.save(partner);

        Optional<DeliveryPartner> found = deliveryPartnerRepository.findByUserId(15L);

        assertThat(found).isPresent();
        assertThat(found.get().getVehicleType()).isEqualTo(VehicleType.BICYCLE);
    }
}
