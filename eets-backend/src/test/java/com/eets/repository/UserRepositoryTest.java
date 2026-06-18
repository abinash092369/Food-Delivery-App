package com.eets.repository;

import com.eets.domain.Role;
import com.eets.domain.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("findByEmail should return user when email matches")
    void testFindByEmail() {
        User user = User.builder()
                .name("Alice")
                .email("alice@gmail.com")
                .phone("1234567890")
                .role(Role.CUSTOMER)
                .isActive(true)
                .build();
        userRepository.save(user);

        Optional<User> found = userRepository.findByEmail("alice@gmail.com");

        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Alice");
    }

    @Test
    @DisplayName("findByPhone should return user when phone matches")
    void testFindByPhone() {
        User user = User.builder()
                .name("Alice")
                .email("alice@gmail.com")
                .phone("1234567890")
                .role(Role.CUSTOMER)
                .isActive(true)
                .build();
        userRepository.save(user);

        Optional<User> found = userRepository.findByPhone("1234567890");

        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Alice");
    }

    @Test
    @DisplayName("findByGoogleId should return user when googleId matches")
    void testFindByGoogleId() {
        User user = User.builder()
                .name("Alice")
                .email("alice@gmail.com")
                .googleId("google-alice-123")
                .role(Role.CUSTOMER)
                .isActive(true)
                .build();
        userRepository.save(user);

        Optional<User> found = userRepository.findByGoogleId("google-alice-123");

        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Alice");
    }

    @Test
    @DisplayName("search should match by query term and role filter")
    void testSearch() {
        User u1 = User.builder().name("Alice Smith").email("alice@gmail.com").role(Role.CUSTOMER).build();
        User u2 = User.builder().name("Bob Jones").email("bjones@gmail.com").role(Role.VENDOR).build();
        User u3 = User.builder().name("Alice Vendor").email("av@gmail.com").role(Role.VENDOR).build();

        userRepository.save(u1);
        userRepository.save(u2);
        userRepository.save(u3);

        // Search name matching "Alice" and role matching CUSTOMER
        Page<User> r1 = userRepository.search("Alice", Role.CUSTOMER, PageRequest.of(0, 10));
        assertThat(r1.getContent()).hasSize(1);
        assertThat(r1.getContent().get(0).getName()).isEqualTo("Alice Smith");

        // Search email matching "gmail.com" and role matching VENDOR
        Page<User> r2 = userRepository.search(null, Role.VENDOR, PageRequest.of(0, 10));
        assertThat(r2.getContent()).hasSize(2);
    }
}
