package com.glucotwin.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glucotwin.entity.HealthRecord;
import com.glucotwin.entity.User;
import com.glucotwin.exception.BusinessException;
import com.glucotwin.repository.HealthRecordRepository;
import com.glucotwin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * ReportService — generates an HTML health report for a given HealthRecord.
 * The browser prints this page to produce a PDF (or the server streams it
 * as a downloadable .html file).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final HealthRecordRepository healthRepo;
    private final UserRepository userRepo;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm");

    public byte[] generateHtmlReport(Long recordId, String requestingEmail) {
        HealthRecord record = healthRepo.findById(recordId)
                .orElseThrow(() -> new BusinessException("Record not found", HttpStatus.NOT_FOUND));

        User requester = userRepo.findByEmail(requestingEmail)
                .orElseThrow(() -> new BusinessException("User not found", HttpStatus.NOT_FOUND));

        boolean isAdmin = "ADMIN".equals(requester.getRole());
        if (!isAdmin && !record.getUserId().equals(requester.getId())) {
            throw new BusinessException("Access denied.", HttpStatus.FORBIDDEN);
        }

        String html = buildHtml(record, requester);
        return html.getBytes(StandardCharsets.UTF_8);
    }

    @SuppressWarnings("unchecked")
    private String buildHtml(HealthRecord r, User user) {
        String riskColor = switch (r.getRiskLevel() != null ? r.getRiskLevel() : "Low") {
            case "High"   -> "#ef4444";
            case "Medium" -> "#f59e0b";
            default       -> "#10b981";
        };

        // Parse SHAP factors
        List<Map<String, Object>> factors = Collections.emptyList();
        try {
            if (r.getFactorsJson() != null && !r.getFactorsJson().isBlank()) {
                factors = objectMapper.readValue(
                        r.getFactorsJson(), new TypeReference<>() {});
            }
        } catch (Exception e) {
            log.warn("Could not parse factorsJson for record {}", r.getId());
        }

        StringBuilder factorRows = new StringBuilder();
        for (Map<String, Object> f : factors) {
            Object imp = f.get("impact");
            Object dir = f.get("direction");
            factorRows.append("<tr><td>").append(f.get("feature"))
                      .append("</td><td>").append(imp).append("%</td>")
                      .append("<td>").append(dir).append(" risk</td></tr>\n");
        }

        String date = r.getCreatedAt() != null ? r.getCreatedAt().format(FMT) : "N/A";

        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8">
            <title>GlucoTwin AI — Health Report #%d</title>
            <style>
              @media print { body { margin: 0; } .no-print { display: none; } }
              * { box-sizing: border-box; }
              body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc;
                     color: #1e293b; margin: 0; padding: 0; }
              .page { max-width: 740px; margin: 0 auto; background: #fff;
                      padding: 48px 40px; min-height: 100vh; }
              .header { display: flex; align-items: center; gap: 16px;
                        border-bottom: 3px solid #00a87e; padding-bottom: 20px; margin-bottom: 28px; }
              .logo { font-size: 26px; font-weight: 900;
                      background: linear-gradient(135deg, #00a87e, #0ea5e9);
                      -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
              .meta { font-size: 13px; color: #64748b; margin-top: 4px; }
              .score-box { text-align: center; background: linear-gradient(135deg, #f0fdf4, #ecfeff);
                           border: 2px solid %s; border-radius: 16px; padding: 28px; margin: 24px 0; }
              .score-pct { font-size: 64px; font-weight: 900; color: %s; line-height: 1; }
              .risk-badge { display: inline-block; background: %s; color: #fff;
                            border-radius: 24px; padding: 6px 20px; font-weight: 700;
                            font-size: 15px; margin-top: 8px; }
              h2 { color: #0f766e; font-size: 16px; margin: 24px 0 10px;
                   padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
              table { width: 100%%; border-collapse: collapse; font-size: 14px; }
              th { background: #f1f5f9; padding: 10px 14px; text-align: left;
                   font-weight: 600; color: #475569; }
              td { padding: 9px 14px; border-bottom: 1px solid #f1f5f9; }
              tr:last-child td { border-bottom: none; }
              .disclaimer { background: #fef9c3; border-left: 4px solid #eab308;
                            padding: 12px 16px; border-radius: 6px; font-size: 13px;
                            color: #78350f; margin-top: 32px; }
              .footer { text-align: center; font-size: 12px; color: #94a3b8;
                        margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
              .print-btn { display: block; width: 160px; margin: 0 auto 24px;
                           background: #00a87e; color: #fff; text-align: center;
                           padding: 10px 0; border-radius: 8px; font-weight: 600;
                           cursor: pointer; border: none; font-size: 15px; }
            </style>
            </head>
            <body>
            <div class="page">
              <button class="print-btn no-print" onclick="window.print()">🖨 Print / Save PDF</button>

              <div class="header">
                <div>
                  <div class="logo">🩺 GlucoTwin AI</div>
                  <div class="meta">Diabetes Risk Assessment Report</div>
                </div>
                <div style="margin-left:auto; text-align:right; font-size:13px; color:#64748b;">
                  <div>Report #%d</div>
                  <div>%s</div>
                  <div>%s</div>
                </div>
              </div>

              <div class="score-box">
                <div class="score-pct">%d%%</div>
                <div style="font-size:15px; color:#64748b; margin-top:4px;">Diabetes Risk Score</div>
                <div class="risk-badge">%s Risk</div>
                <div style="font-size:13px; color:#64748b; margin-top:8px;">AI Assessment: %s</div>
              </div>

              <h2>📋 Health Parameters</h2>
              <table>
                <tr><th>Parameter</th><th>Value</th></tr>
                <tr><td>Gender</td><td>%s</td></tr>
                <tr><td>Age</td><td>%s years</td></tr>
                <tr><td>BMI</td><td>%s kg/m²</td></tr>
                <tr><td>HbA1c Level</td><td>%s%%</td></tr>
                <tr><td>Blood Glucose Level</td><td>%s mg/dL</td></tr>
                <tr><td>Hypertension</td><td>%s</td></tr>
                <tr><td>Heart Disease</td><td>%s</td></tr>
                <tr><td>Smoking History</td><td>%s</td></tr>
              </table>

              <h2>🧠 Explainable AI — Contributing Factors (SHAP)</h2>
              <table>
                <tr><th>Factor</th><th>Impact</th><th>Direction</th></tr>
                %s
              </table>

              <div class="disclaimer">
                ⚕️ <strong>Medical Disclaimer:</strong> This report is generated by an AI model
                trained on population data and is <strong>not</strong> a medical diagnosis.
                Risk scores are probabilistic estimates. Please consult a qualified healthcare
                professional before making any health decisions.
              </div>

              <div class="footer">
                Generated by GlucoTwin AI • Powered by Random Forest + SHAP Explainability<br>
                © %d GlucoTwin AI — Final Year Project
              </div>
            </div>
            </body></html>
            """.formatted(
                r.getId(),
                riskColor, riskColor, riskColor,
                r.getId(),
                date,
                user.getName() + " (" + user.getEmail() + ")",
                r.getRiskPercentage() != null ? r.getRiskPercentage() : 0,
                r.getRiskLevel() != null ? r.getRiskLevel() : "Low",
                r.getPrediction() != null ? r.getPrediction() : "N/A",
                r.getGender() != null ? r.getGender() : "N/A",
                r.getAge() != null ? r.getAge().intValue() : "N/A",
                r.getBmi() != null ? r.getBmi() : "N/A",
                r.getHba1cLevel() != null ? r.getHba1cLevel() : "N/A",
                r.getBloodGlucoseLevel() != null ? r.getBloodGlucoseLevel().intValue() : "N/A",
                Boolean.TRUE.equals(r.getHypertension()) ? "Yes" : "No",
                Boolean.TRUE.equals(r.getHeartDisease()) ? "Yes" : "No",
                r.getSmokingHistory() != null ? r.getSmokingHistory() : "N/A",
                factorRows.toString(),
                java.time.LocalDateTime.now().getYear()
        );
    }
}
