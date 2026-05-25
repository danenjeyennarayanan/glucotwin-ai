package com.glucotwin.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glucotwin.dto.AuthRequest;
import com.glucotwin.dto.AuthResponse;
import com.glucotwin.exception.BusinessException;
import com.glucotwin.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@TestPropertySource(properties = {
    "cors.allowed-origins=http://localhost:3000",
    "jwt.secret=TestSecretKeyForJwtThatIsLongEnoughForHS256!!",
    "jwt.expiration=86400000",
    "anthropic.api.key=",
    "ml.service.url=http://localhost:5001",
    "ml.service.timeout-seconds=5",
    "ml.service.retry-attempts=1"
})
class AuthControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;

    @MockBean AuthService authService;
    // These beans are needed by the auto-loaded SecurityConfig and JwtAuthFilter
    @MockBean com.glucotwin.security.JwtUtil jwtUtil;

    private AuthRequest validRegisterReq() {
        AuthRequest r = new AuthRequest();
        r.setName("John Doe");
        r.setEmail("john@test.com");
        r.setPassword("secret123");
        return r;
    }

    private AuthRequest validLoginReq() {
        AuthRequest r = new AuthRequest();
        r.setEmail("john@test.com");
        r.setPassword("secret123");
        return r;
    }

    // ── /api/auth/register ─────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/register — 200 on valid payload")
    void register_validPayload_returns200() throws Exception {
        AuthResponse resp = new AuthResponse("tok", "John Doe", "john@test.com", "USER", 1L);
        when(authService.register(any())).thenReturn(resp);

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(validRegisterReq())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value("tok"));
    }

    @Test
    @DisplayName("POST /api/auth/register — 400 when email is blank")
    void register_blankEmail_returns400() throws Exception {
        AuthRequest bad = validRegisterReq();
        bad.setEmail("");

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(bad)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/register — 400 when password is too short")
    void register_shortPassword_returns400() throws Exception {
        AuthRequest bad = validRegisterReq();
        bad.setPassword("abc");

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(bad)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/register — 400 on duplicate email via service")
    void register_duplicateEmail_returns400() throws Exception {
        when(authService.register(any())).thenThrow(new BusinessException("Email already registered."));

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(validRegisterReq())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── /api/auth/login ────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/login — 200 on valid credentials")
    void login_validCredentials_returns200() throws Exception {
        AuthResponse resp = new AuthResponse("tok", "John Doe", "john@test.com", "USER", 1L);
        when(authService.login(any())).thenReturn(resp);

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(validLoginReq())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("USER"));
    }

    @Test
    @DisplayName("POST /api/auth/login — 401 on bad credentials via service")
    void login_badCredentials_returns401() throws Exception {
        when(authService.login(any())).thenThrow(
                new BusinessException("Invalid credentials.", org.springframework.http.HttpStatus.UNAUTHORIZED));

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(validLoginReq())))
                .andExpect(status().isUnauthorized());
    }
}
