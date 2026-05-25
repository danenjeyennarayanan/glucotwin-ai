package com.glucotwin.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glucotwin.dto.HealthRequest;
import com.glucotwin.entity.HealthRecord;
import com.glucotwin.entity.User;
import com.glucotwin.exception.BusinessException;
import com.glucotwin.repository.HealthRecordRepository;
import com.glucotwin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class HealthService {

    private final MlService mlService;
    private final HealthRecordRepository healthRepo;
    private final UserRepository userRepo;
    private final ObjectMapper objectMapper;
    private final EmailService emailService;

    @Transactional
    public Map<String, Object> predict(HealthRequest req, String requestingEmail) {
        // Ownership check — users can only submit predictions for themselves
        User requester = userRepo.findByEmail(requestingEmail)
                .orElseThrow(() -> new BusinessException("User not found", HttpStatus.NOT_FOUND));

        boolean isAdmin = "ADMIN".equals(requester.getRole());
        if (!isAdmin && !requester.getId().equals(req.getUserId())) {
            log.warn("Ownership violation: {} attempted prediction for userId={}", requestingEmail, req.getUserId());
            throw new BusinessException("You can only submit predictions for your own account.", HttpStatus.FORBIDDEN);
        }

        User targetUser = isAdmin && !requester.getId().equals(req.getUserId())
                ? userRepo.findById(req.getUserId())
                        .orElseThrow(() -> new BusinessException("Target user not found", HttpStatus.NOT_FOUND))
                : requester;

        // Build ML payload
        Map<String, Object> payload = buildMlPayload(req);
        log.info("Prediction requested for userId={} by {}", req.getUserId(), requestingEmail);

        Map<String, Object> result = mlService.predict(payload);

        // Persist record
        String factorsJson = null;
        try {
            factorsJson = objectMapper.writeValueAsString(result.get("factors"));
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize factors JSON", e);
        }

        HealthRecord record = HealthRecord.builder()
                .user(targetUser)
                .gender(req.getGender())
                .age(req.getAge())
                .hypertension(req.getHypertension())
                .heartDisease(req.getHeartDisease())
                .smokingHistory(req.getSmokingHistory())
                .bmi(req.getBmi())
                .hba1cLevel(req.getHba1cLevel())
                .bloodGlucoseLevel(req.getBloodGlucoseLevel())
                .riskPercentage(toInt(result.get("risk_percentage")))
                .riskLevel((String) result.getOrDefault("risk_level", "Low"))
                .prediction((String) result.getOrDefault("prediction", "Non-Diabetic"))
                .factorsJson(factorsJson)
                .build();
        healthRepo.save(record);

        log.info("Prediction saved: userId={} riskLevel={} prediction={}",
                req.getUserId(), record.getRiskLevel(), record.getPrediction());
        // Fire-and-forget email notification (non-blocking)
        try {
            emailService.sendRiskReport(targetUser.getEmail(), targetUser.getName(),
                    record.getRiskLevel(), record.getRiskPercentage() != null ? record.getRiskPercentage() : 0);
        } catch (Exception emailEx) {
            log.warn("Email notification failed (non-fatal): {}", emailEx.getMessage());
        }
        return result;
    }

    public List<HealthRecord> getHistory(Long userId, String requestingEmail) {
        validateAccess(userId, requestingEmail);
        return healthRepo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Optional<HealthRecord> getLatest(Long userId, String requestingEmail) {
        validateAccess(userId, requestingEmail);
        return healthRepo.findTopByUserIdOrderByCreatedAtDesc(userId);
    }

    private void validateAccess(Long userId, String requestingEmail) {
        User requester = userRepo.findByEmail(requestingEmail)
                .orElseThrow(() -> new BusinessException("User not found", HttpStatus.NOT_FOUND));
        boolean isAdmin = "ADMIN".equals(requester.getRole());
        if (!isAdmin && !requester.getId().equals(userId)) {
            log.warn("Unauthorized history access: {} tried to access userId={}", requestingEmail, userId);
            throw new BusinessException("Access denied.", HttpStatus.FORBIDDEN);
        }
    }

    private Map<String, Object> buildMlPayload(HealthRequest req) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("gender", req.getGender());
        payload.put("age", req.getAge());
        payload.put("hypertension", req.getHypertension() ? 1 : 0);
        payload.put("heart_disease", req.getHeartDisease() ? 1 : 0);
        payload.put("smoking_history", req.getSmokingHistory());
        payload.put("bmi", req.getBmi());
        payload.put("HbA1c_level", req.getHba1cLevel());
        payload.put("blood_glucose_level", req.getBloodGlucoseLevel());
        return payload;
    }

    private Integer toInt(Object val) {
        if (val == null) return 0;
        try { return Integer.parseInt(val.toString()); }
        catch (NumberFormatException e) { return 0; }
    }
}
