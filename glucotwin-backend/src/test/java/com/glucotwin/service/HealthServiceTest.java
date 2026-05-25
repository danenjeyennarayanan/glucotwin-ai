package com.glucotwin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glucotwin.dto.HealthRequest;
import com.glucotwin.entity.HealthRecord;
import com.glucotwin.entity.User;
import com.glucotwin.exception.BusinessException;
import com.glucotwin.repository.HealthRecordRepository;
import com.glucotwin.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HealthServiceTest {

    @Mock MlService mlService;
    @Mock HealthRecordRepository healthRepo;
    @Mock UserRepository userRepo;

    @InjectMocks HealthService healthService;

    // inject ObjectMapper manually since it's not a Spring context
    @BeforeEach
    void setup() {
        org.springframework.test.util.ReflectionTestUtils.setField(
                healthService, "objectMapper", new ObjectMapper());
    }

    private User makeUser(Long id, String email, String role) {
        return User.builder().id(id).email(email).role(role).name("Test").password("hashed").build();
    }

    private HealthRequest makeRequest(Long userId) {
        HealthRequest req = new HealthRequest();
        req.setUserId(userId);
        req.setGender("Male");
        req.setAge(45.0);
        req.setHypertension(false);
        req.setHeartDisease(false);
        req.setSmokingHistory("never");
        req.setBmi(27.5);
        req.setHba1cLevel(5.8);
        req.setBloodGlucoseLevel(140.0);
        return req;
    }

    // ── predict ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("predict: user submits prediction for own account — succeeds")
    void predict_ownAccount_success() {
        User user = makeUser(1L, "user@test.com", "USER");
        when(userRepo.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(mlService.predict(any())).thenReturn(Map.of(
                "risk_percentage", 35,
                "risk_level", "Medium",
                "prediction", "Non-Diabetic",
                "factors", List.of()
        ));
        when(healthRepo.save(any())).thenReturn(new HealthRecord());

        Map<String, Object> result = healthService.predict(makeRequest(1L), "user@test.com");

        assertThat(result).containsKey("risk_percentage");
        verify(healthRepo).save(any(HealthRecord.class));
    }

    @Test
    @DisplayName("predict: user tries to predict for another user — throws FORBIDDEN")
    void predict_otherUserAccount_throws() {
        User user = makeUser(1L, "user@test.com", "USER");
        when(userRepo.findByEmail("user@test.com")).thenReturn(Optional.of(user));

        HealthRequest req = makeRequest(99L); // different userId

        BusinessException ex = catchThrowableOfType(
                () -> healthService.predict(req, "user@test.com"), BusinessException.class);

        assertThat(ex).isNotNull();
        assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("predict: admin can predict for any user")
    void predict_adminForOtherUser_success() {
        User admin = makeUser(1L, "admin@test.com", "ADMIN");
        User target = makeUser(2L, "patient@test.com", "USER");

        when(userRepo.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));
        when(userRepo.findById(2L)).thenReturn(Optional.of(target));
        when(mlService.predict(any())).thenReturn(Map.of(
                "risk_percentage", 70,
                "risk_level", "High",
                "prediction", "Diabetic",
                "factors", List.of()
        ));
        when(healthRepo.save(any())).thenReturn(new HealthRecord());

        Map<String, Object> result = healthService.predict(makeRequest(2L), "admin@test.com");

        assertThat(result.get("risk_level")).isEqualTo("High");
    }

    // ── getHistory ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("getHistory: user accesses own history — returns records")
    void getHistory_ownAccount() {
        User user = makeUser(1L, "user@test.com", "USER");
        when(userRepo.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(healthRepo.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(new HealthRecord()));

        List<HealthRecord> history = healthService.getHistory(1L, "user@test.com");

        assertThat(history).hasSize(1);
    }

    @Test
    @DisplayName("getHistory: user accesses another user's history — throws FORBIDDEN")
    void getHistory_otherUser_throws() {
        User user = makeUser(1L, "user@test.com", "USER");
        when(userRepo.findByEmail("user@test.com")).thenReturn(Optional.of(user));

        BusinessException ex = catchThrowableOfType(
                () -> healthService.getHistory(99L, "user@test.com"), BusinessException.class);

        assertThat(ex).isNotNull();
        assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    // ── getLatest ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("getLatest: returns empty when no records exist")
    void getLatest_noRecords() {
        User user = makeUser(1L, "user@test.com", "USER");
        when(userRepo.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(healthRepo.findTopByUserIdOrderByCreatedAtDesc(1L)).thenReturn(Optional.empty());

        Optional<HealthRecord> result = healthService.getLatest(1L, "user@test.com");

        assertThat(result).isEmpty();
    }
}
