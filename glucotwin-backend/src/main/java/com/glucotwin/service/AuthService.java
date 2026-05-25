package com.glucotwin.service;

import com.glucotwin.dto.AuthRequest;
import com.glucotwin.dto.AuthResponse;
import com.glucotwin.entity.User;
import com.glucotwin.exception.BusinessException;
import com.glucotwin.repository.UserRepository;
import com.glucotwin.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(AuthRequest req) {
        if (req.getName() == null || req.getName().isBlank()) {
            throw new BusinessException("Name is required for registration.");
        }
        if (userRepo.existsByEmail(req.getEmail())) {
            log.warn("Registration attempt with duplicate email: {}", req.getEmail());
            throw new BusinessException("Email already registered.");
        }

        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(encoder.encode(req.getPassword()))
                .role("USER")
                .build();
        userRepo.save(user);

        log.info("New user registered: {} (id={})", user.getEmail(), user.getId());
        String token = jwtUtil.generate(user.getEmail(), user.getRole());
        return new AuthResponse(token, user.getName(), user.getEmail(), user.getRole(), user.getId());
    }

    public AuthResponse login(AuthRequest req) {
        User user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> {
                    log.warn("Login failed — unknown email: {}", req.getEmail());
                    return new BusinessException("Invalid credentials.", HttpStatus.UNAUTHORIZED);
                });

        if (!encoder.matches(req.getPassword(), user.getPassword())) {
            log.warn("Login failed — wrong password for: {}", req.getEmail());
            throw new BusinessException("Invalid credentials.", HttpStatus.UNAUTHORIZED);
        }

        log.info("User logged in: {} role={}", user.getEmail(), user.getRole());
        String token = jwtUtil.generate(user.getEmail(), user.getRole());
        return new AuthResponse(token, user.getName(), user.getEmail(), user.getRole(), user.getId());
    }
}
