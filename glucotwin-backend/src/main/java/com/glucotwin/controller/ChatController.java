package com.glucotwin.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * ChatController — Proxies AI chatbot requests to Anthropic API server-side.
 *
 * SECURITY FIX: The original implementation called api.anthropic.com directly
 * from the browser, which would expose the API key in frontend code.
 * This controller keeps the key safely in Spring Boot environment variables.
 *
 * Endpoint: POST /api/chat
 * Body:     { "message": "user question here" }
 * Response: { "reply": "AI response here" }
 */
@RestController
@RequestMapping("/api/chat")
@Slf4j
@Tag(name = "Chat", description = "AI Chatbot powered by Claude (proxied server-side)")
public class ChatController {

    @Value("${anthropic.api.key:#{null}}")
    private String anthropicApiKey;

    @Value("${anthropic.model:claude-sonnet-4-20250514}")
    private String anthropicModel;

    private final ObjectMapper mapper = new ObjectMapper();

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    private static final String SYSTEM_PROMPT =
            "You are GlucoBot, a friendly and knowledgeable AI health assistant specializing in " +
            "diabetes awareness, prevention, and management. You help users understand their diabetes " +
            "risk, explain medical terms, and provide evidence-based lifestyle advice. " +
            "Always remind users to consult a healthcare professional for personalized medical advice. " +
            "Keep responses concise, empathetic, and easy to understand. " +
            "Never diagnose or prescribe — only educate and guide.";

    @PostMapping
    @Operation(
        summary = "Send a message to the GlucoBot AI chatbot",
        description = "Proxies the message to Anthropic Claude API server-side. " +
                      "Requires ANTHROPIC_API_KEY environment variable to be set.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, String> body) {
        String userMessage = body.getOrDefault("message", "").trim();

        if (userMessage.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Message cannot be empty"));
        }

        if (userMessage.length() > 1000) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Message too long (max 1000 characters)"));
        }

        // If no API key configured, return a helpful fallback response
        if (anthropicApiKey == null || anthropicApiKey.isBlank() || anthropicApiKey.equals("null")) {
            log.warn("ANTHROPIC_API_KEY not configured — returning fallback chatbot response");
            return ResponseEntity.ok(Map.of(
                "reply", getFallbackResponse(userMessage),
                "source", "fallback"
            ));
        }

        try {
            Map<String, Object> requestBody = Map.of(
                "model", anthropicModel,
                "max_tokens", 500,
                "system", SYSTEM_PROMPT,
                "messages", List.of(
                    Map.of("role", "user", "content", userMessage)
                )
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.anthropic.com/v1/messages"))
                    .header("Content-Type", "application/json")
                    .header("x-api-key", anthropicApiKey)
                    .header("anthropic-version", "2023-06-01")
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(requestBody)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Anthropic API error: HTTP {}", response.statusCode());
                return ResponseEntity.ok(Map.of(
                    "reply", "I'm having trouble connecting right now. Please try again shortly.",
                    "source", "error"
                ));
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> parsed = mapper.readValue(response.body(), Map.class);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> content = (List<Map<String, Object>>) parsed.get("content");
            String reply = content != null && !content.isEmpty()
                    ? (String) content.get(0).get("text")
                    : "I couldn't generate a response. Please try again.";

            log.info("ChatBot responded to: \"{}...\"", userMessage.substring(0, Math.min(40, userMessage.length())));
            return ResponseEntity.ok(Map.of("reply", reply, "source", "claude"));

        } catch (Exception e) {
            log.error("ChatBot error: {}", e.getMessage());
            return ResponseEntity.ok(Map.of(
                "reply", "I'm having a temporary issue. Please try again in a moment.",
                "source", "error"
            ));
        }
    }

    /**
     * Fallback responses when Anthropic API key is not configured.
     * Useful for demo environments without an API key.
     */
    private String getFallbackResponse(String message) {
        String lower = message.toLowerCase();
        if (lower.contains("diabetes") || lower.contains("risk"))
            return "Diabetes is a chronic condition affecting blood sugar regulation. Key risk factors include high BMI, elevated blood glucose (>126 mg/dL), HbA1c ≥ 6.5%, age, and family history. Use GlucoTwin's prediction tool to assess your personal risk!";
        if (lower.contains("bmi") || lower.contains("weight"))
            return "BMI (Body Mass Index) is calculated as weight(kg) / height(m)². A BMI of 18.5–24.9 is considered healthy. BMI ≥ 30 significantly increases diabetes risk. Even a 5–7% weight loss can reduce diabetes risk by up to 58%.";
        if (lower.contains("hba1c") || lower.contains("a1c"))
            return "HbA1c measures your average blood sugar over 2–3 months. Normal: below 5.7%. Pre-diabetes: 5.7–6.4%. Diabetes: 6.5% or higher. Regular monitoring is key — aim to keep it below 5.7% for optimal health.";
        if (lower.contains("glucose") || lower.contains("blood sugar"))
            return "Fasting blood glucose levels: Normal is below 100 mg/dL, Pre-diabetes is 100–125 mg/dL, and Diabetes is 126 mg/dL or above. Regular monitoring and a low-glycemic diet help maintain healthy levels.";
        if (lower.contains("exercise") || lower.contains("workout"))
            return "Exercise is one of the most effective ways to prevent and manage diabetes. Aim for 150 minutes of moderate activity per week (e.g., brisk walking, cycling). Exercise increases insulin sensitivity and helps manage blood glucose levels.";
        if (lower.contains("diet") || lower.contains("food") || lower.contains("eat"))
            return "A diabetes-friendly diet focuses on: whole grains, vegetables, lean proteins, and healthy fats. Limit refined carbs, sugary drinks, and processed foods. The Mediterranean diet has strong evidence for diabetes prevention.";
        return "I'm GlucoBot, your diabetes awareness assistant! 🩺 I can help you understand diabetes risk factors, explain your GlucoTwin results, and provide lifestyle guidance. Ask me about blood glucose, HbA1c, BMI, diet, or exercise!";
    }
}
