package com.glucotwin.controller;

import com.glucotwin.dto.ApiResponse;
import com.glucotwin.dto.HealthRequest;
import com.glucotwin.entity.HealthRecord;
import com.glucotwin.service.HealthService;
import com.glucotwin.service.MlService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.glucotwin.service.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
@Tag(name = "Health", description = "Prediction, history, and simulation endpoints")
public class HealthController {

    private final HealthService healthService;
    private final MlService mlService;
    private final ReportService reportService;

    @GetMapping("/ping")
    @Operation(summary = "Health check — no auth required")
    public ResponseEntity<Map<String, String>> ping() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "GlucoTwin API"));
    }

    @PostMapping("/predict")
    @Operation(summary = "Submit health data and get diabetes risk prediction",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Map<String, Object>>> predict(
            @Valid @RequestBody HealthRequest req,
            Authentication auth) {
        Map<String, Object> result = healthService.predict(req, auth.getName());
        // Append medical disclaimer
        result.put("disclaimer", "This prediction is AI-assisted and not a medical diagnosis. " +
                "Please consult a qualified healthcare professional for medical advice.");
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * POST /api/health/simulate
     * Proxies the simulation request through Spring Boot to the ML service.
     * This prevents browser-to-ML direct calls (CORS/security fix).
     *
     * Expected body: { "base": { ...health fields }, "modified": { ...health fields } }
     */
    @PostMapping("/simulate")
    @Operation(summary = "Simulate how health changes affect diabetes risk",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Map<String, Object>>> simulate(
            @RequestBody Map<String, Object> payload,
            Authentication auth) {
        Map<String, Object> result = mlService.simulate(payload);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/history/{userId}")
    @Operation(summary = "Get prediction history for a user",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<HealthRecord>>> history(
            @PathVariable Long userId,
            Authentication auth) {
        List<HealthRecord> records = healthService.getHistory(userId, auth.getName());
        return ResponseEntity.ok(ApiResponse.ok(records));
    }

    @GetMapping("/latest/{userId}")
    @Operation(summary = "Get the most recent prediction for a user",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<HealthRecord>> latest(
            @PathVariable Long userId,
            Authentication auth) {
        return healthService.getLatest(userId, auth.getName())
                .map(record -> ResponseEntity.ok(ApiResponse.ok(record)))
                .orElse(ResponseEntity.ok(ApiResponse.ok("No records found", null)));
    }

    /**
     * GET /api/health/report/{recordId}/pdf
     * Downloads an HTML-based health report as a PDF-like attachment.
     * The frontend uses window.print() for true PDF rendering; this endpoint
     * provides a server-side HTML report that browsers can save/print-to-PDF.
     */
    @GetMapping(value = "/report/{recordId}/pdf", produces = MediaType.TEXT_HTML_VALUE)
    @Operation(summary = "Download health report as printable HTML/PDF",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<byte[]> downloadReport(
            @PathVariable Long recordId,
            Authentication auth) {
        byte[] html = reportService.generateHtmlReport(recordId, auth.getName());
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_HTML);
        headers.setContentDispositionFormData("attachment", "glucotwin-report-" + recordId + ".html");
        headers.setContentLength(html.length);
        return ResponseEntity.ok().headers(headers).body(html);
    }
}
