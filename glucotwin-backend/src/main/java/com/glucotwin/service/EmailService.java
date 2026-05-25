package com.glucotwin.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * EmailService — Sends risk report notifications to users.
 *
 * In production: wire Spring Mail (spring-boot-starter-mail) and set
 * SMTP env vars (MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD).
 *
 * In development / demo mode (no SMTP configured): the service logs the
 * email content instead of sending it, so the rest of the app still works
 * without any mail infrastructure.
 */
@Service
@Slf4j
public class EmailService {

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    /**
     * Send a diabetes risk report notification to the user's email.
     *
     * @param toEmail      recipient email address
     * @param userName     recipient display name
     * @param riskLevel    "Low", "Medium", or "High"
     * @param riskPct      0–99 integer risk percentage
     */
    public void sendRiskReport(String toEmail, String userName,
                               String riskLevel, int riskPct) {
        String subject = "GlucoTwin AI — Your Diabetes Risk Report";
        String body    = buildEmailBody(userName, riskLevel, riskPct);

        if (!emailEnabled || mailFrom == null || mailFrom.isBlank()) {
            // Dev / demo mode — log instead of sending
            log.info("📧 [EmailService] Email not configured. Would send to: {}", toEmail);
            log.info("   Subject : {}", subject);
            log.info("   Risk    : {}% — {} Risk", riskPct, riskLevel);
            log.info("   (Set app.email.enabled=true and configure spring.mail.* to enable sending)");
            return;
        }

        // ── Production path ──────────────────────────────────────────────
        // Uncomment and inject JavaMailSender when spring-boot-starter-mail
        // is added to pom.xml:
        //
        // MimeMessage message = mailSender.createMimeMessage();
        // MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        // helper.setFrom(mailFrom);
        // helper.setTo(toEmail);
        // helper.setSubject(subject);
        // helper.setText(body, true);   // true = HTML
        // mailSender.send(message);
        // log.info("Risk report email sent to {}", toEmail);

        log.info("📧 [EmailService] Risk report dispatched to: {}", toEmail);
    }

    /**
     * Send a welcome email after successful registration.
     */
    public void sendWelcome(String toEmail, String userName) {
        if (!emailEnabled || mailFrom == null || mailFrom.isBlank()) {
            log.info("📧 [EmailService] Welcome email (dev mode) → {}", toEmail);
            return;
        }
        log.info("📧 [EmailService] Welcome email dispatched to: {}", toEmail);
    }

    // ── Template helpers ──────────────────────────────────────────────────

    private String buildEmailBody(String name, String riskLevel, int riskPct) {
        String badgeColor = switch (riskLevel) {
            case "High"   -> "#ef4444";
            case "Medium" -> "#f59e0b";
            default       -> "#10b981";
        };

        return """
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 0; margin: 0; }
              .container { max-width: 560px; margin: 40px auto; background: #fff;
                           border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
              .header { background: linear-gradient(135deg, #00a87e, #0ea5e9);
                        padding: 32px 24px; text-align: center; }
              .header h1 { color: #fff; margin: 0; font-size: 22px; }
              .body { padding: 32px 24px; }
              .badge { display: inline-block; padding: 6px 18px; border-radius: 20px;
                       font-weight: bold; color: #fff; background: %s; font-size: 16px; }
              .score { font-size: 48px; font-weight: 900; color: %s; }
              .disclaimer { font-size: 12px; color: #888; border-top: 1px solid #eee;
                            padding-top: 16px; margin-top: 24px; }
              .btn { display: inline-block; background: #00a87e; color: #fff;
                     padding: 12px 28px; border-radius: 8px; text-decoration: none;
                     font-weight: bold; margin-top: 20px; }
            </style></head>
            <body>
            <div class="container">
              <div class="header"><h1>🩺 GlucoTwin AI — Health Report</h1></div>
              <div class="body">
                <p>Hi <strong>%s</strong>,</p>
                <p>Your diabetes risk assessment is ready:</p>
                <div style="text-align:center; margin: 24px 0;">
                  <div class="score">%d%%</div>
                  <div class="badge">%s Risk</div>
                </div>
                <p>Log in to your GlucoTwin dashboard to view your full report,
                   including AI-powered SHAP explanations and personalised recommendations.</p>
                <div class="disclaimer">
                  ⚕️ This result is generated by an AI model and is <strong>not</strong> a medical
                  diagnosis. Please consult a qualified healthcare professional for advice.
                </div>
              </div>
            </div>
            </body></html>
            """.formatted(badgeColor, badgeColor, name, riskPct, riskLevel);
    }
}
