package com.glucotwin.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;

class JwtUtilTest {

    JwtUtil jwtUtil;

    // Must be ≥ 32 chars for HS256
    private static final String SECRET = "TestSecretKeyForJwtThatIsLongEnough!!";
    private static final long EXPIRATION = 86_400_000L; // 24 h

    @BeforeEach
    void setup() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", SECRET);
        ReflectionTestUtils.setField(jwtUtil, "expiration", EXPIRATION);
    }

    @Test
    @DisplayName("generate + extractEmail: round-trip preserves email")
    void generateAndExtractEmail() {
        String token = jwtUtil.generate("user@test.com", "USER");
        assertThat(jwtUtil.extractEmail(token)).isEqualTo("user@test.com");
    }

    @Test
    @DisplayName("generate + extractRole: round-trip preserves role")
    void generateAndExtractRole() {
        String token = jwtUtil.generate("admin@test.com", "ADMIN");
        assertThat(jwtUtil.extractRole(token)).isEqualTo("ADMIN");
    }

    @Test
    @DisplayName("isValid: fresh token returns true")
    void isValid_freshToken() {
        String token = jwtUtil.generate("user@test.com", "USER");
        assertThat(jwtUtil.isValid(token)).isTrue();
    }

    @Test
    @DisplayName("isValid: tampered token returns false")
    void isValid_tamperedToken() {
        String token = jwtUtil.generate("user@test.com", "USER");
        String tampered = token.substring(0, token.length() - 4) + "XXXX";
        assertThat(jwtUtil.isValid(tampered)).isFalse();
    }

    @Test
    @DisplayName("isValid: expired token returns false")
    void isValid_expiredToken() {
        ReflectionTestUtils.setField(jwtUtil, "expiration", -1000L); // already expired
        String token = jwtUtil.generate("user@test.com", "USER");
        assertThat(jwtUtil.isValid(token)).isFalse();
    }

    @Test
    @DisplayName("isValid: completely invalid string returns false")
    void isValid_garbage() {
        assertThat(jwtUtil.isValid("not.a.jwt")).isFalse();
    }
}
