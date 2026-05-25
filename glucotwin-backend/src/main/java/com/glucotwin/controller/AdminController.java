package com.glucotwin.controller;

import com.glucotwin.dto.ApiResponse;
import com.glucotwin.entity.User;
import com.glucotwin.repository.HealthRecordRepository;
import com.glucotwin.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin", description = "Admin-only endpoints — requires ROLE_ADMIN")
public class AdminController {

    private final UserRepository userRepo;
    private final HealthRecordRepository healthRepo;

    @GetMapping("/users")
    @Operation(summary = "List all users", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<User>>> users(Authentication auth) {
        log.info("Admin {} accessed /admin/users", auth.getName());
        return ResponseEntity.ok(ApiResponse.ok(userRepo.findAll()));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get platform statistics", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Map<String, Object>>> stats(Authentication auth) {
        log.info("Admin {} accessed /admin/stats", auth.getName());

        long totalUsers       = userRepo.count();
        long totalPredictions = healthRepo.count();
        long highRisk         = healthRepo.countByRiskLevel("High");
        long medRisk          = healthRepo.countByRiskLevel("Medium");
        long lowRisk          = healthRepo.countByRiskLevel("Low");

        Map<String, Object> stats = Map.of(
                "totalUsers", totalUsers,
                "totalPredictions", totalPredictions,
                "highRisk", highRisk,
                "mediumRisk", medRisk,
                "lowRisk", lowRisk
        );
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }
}
