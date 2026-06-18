package com.eets.security;

import com.eets.domain.User;
import com.eets.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) {
        User u = userRepository.findByEmail(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        return new org.springframework.security.core.userdetails.User(
            u.getEmail(),
            u.getPasswordHash() == null ? "" : u.getPasswordHash(),
            Boolean.TRUE.equals(u.getIsActive()) && !Boolean.TRUE.equals(u.getIsBanned()),
            true, true, !Boolean.TRUE.equals(u.getIsBanned()),
            List.of(new SimpleGrantedAuthority("ROLE_" + u.getRole().name()))
        );
    }
}
