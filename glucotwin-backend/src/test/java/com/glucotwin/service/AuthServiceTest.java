package com.glucotwin.service;

import com.glucotwin.dto.AuthRequest;
import com.glucotwin.dto.AuthResponse;
import com.glucotwin.entity.User;
import com.glucotwin.exception.BusinessException;
import com.glucotwin.repository.UserRepository;
import com.glucotwin.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepo;
    @Mock PasswordEncoder encoder;
    @Mock JwtUtil jwtUtil;

    @InjectMocks AuthService authService;

    AuthRequest req;
    User savedUser;

    @BeforeEach
    void setup() {
        req = new AuthRequest();
        req.setName("Test User");
        req.setEmail("test@example.com");
        req.setPassword("password123");

        savedUser = User.builder()
                .id(1L)
                .name("Test User")
                .email("test@example.com")
                .password("$2a$hashed")
                .role("USER")
                .build();
    }

    // ── Registration tests ─────────────────────────────────────────────────

    @Test
    @DisplayName("register: success — new email registers and returns token")
    void register_success() {
        when(userRepo.existsByEmail(req.getEmail())).thenReturn(false);
        when(encoder.encode(req.getPassword())).thenReturn("$2a$hashed");
        when(userRepo.save(any(User.class))).thenReturn(savedUser);
        when(jwtUtil.generate(anyString(), anyString())).thenReturn("jwt-token");

        AuthResponse resp = authService.register(req);

        assertThat(resp.getToken()).isEqualTo("jwt-token");
        assertThat(resp.getEmail()).isEqualTo("test@example.com");
        assertThat(resp.getRole()).isEqualTo("USER");
        verify(userRepo).save(any(User.class));
    }

    @Test
    @DisplayName("register: duplicate email throws BusinessException")
    void register_duplicateEmail() {
        when(userRepo.existsByEmail(req.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("already registered");
    }

    @Test
    @DisplayName("register: missing name throws BusinessException")
    void register_missingName() {
        req.setName(null);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Name is required");
    }

    @Test
    @DisplayName("register: blank name throws BusinessException")
    void register_blankName() {
        req.setName("   ");

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Name is required");
    }

    // ── Login tests ────────────────────────────────────────────────────────

    @Test
    @DisplayName("login: success — valid credentials return token")
    void login_success() {
        when(userRepo.findByEmail(req.getEmail())).thenReturn(Optional.of(savedUser));
        when(encoder.matches(req.getPassword(), savedUser.getPassword())).thenReturn(true);
        when(jwtUtil.generate(anyString(), anyString())).thenReturn("jwt-token");

        AuthResponse resp = authService.login(req);

        assertThat(resp.getToken()).isEqualTo("jwt-token");
        assertThat(resp.getEmail()).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("login: unknown email throws UNAUTHORIZED BusinessException")
    void login_unknownEmail() {
        when(userRepo.findByEmail(req.getEmail())).thenReturn(Optional.empty());

        BusinessException ex = catchThrowableOfType(
                () -> authService.login(req), BusinessException.class);

        assertThat(ex).isNotNull();
        assertThat(ex.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("login: wrong password throws UNAUTHORIZED BusinessException")
    void login_wrongPassword() {
        when(userRepo.findByEmail(req.getEmail())).thenReturn(Optional.of(savedUser));
        when(encoder.matches(req.getPassword(), savedUser.getPassword())).thenReturn(false);

        BusinessException ex = catchThrowableOfType(
                () -> authService.login(req), BusinessException.class);

        assertThat(ex).isNotNull();
        assertThat(ex.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
