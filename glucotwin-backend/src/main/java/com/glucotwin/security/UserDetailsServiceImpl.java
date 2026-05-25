package com.glucotwin.security;

import com.glucotwin.entity.User;
import com.glucotwin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * UserDetailsServiceImpl
 *
 * Loads user-specific data for Spring Security. Used by the
 * authentication manager and any component that needs a fully-resolved
 * UserDetails object (e.g. password verification during login, method
 * security, session management).
 *
 * Note: JwtAuthFilter already authenticates stateless requests via JWT,
 * so this service is primarily used during the login flow and by Spring
 * Security's internal wiring to avoid the auto-generated random password.
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "No user found with email: " + email));

        // Map stored role string → Spring Security GrantedAuthority
        // e.g. "USER" → "ROLE_USER",  "ADMIN" → "ROLE_ADMIN"
        String grantedRole = user.getRole().startsWith("ROLE_")
                ? user.getRole()
                : "ROLE_" + user.getRole();

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                List.of(new SimpleGrantedAuthority(grantedRole))
        );
    }
}
