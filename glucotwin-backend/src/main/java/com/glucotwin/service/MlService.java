package com.glucotwin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glucotwin.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

@Service
@Slf4j
public class MlService {

    @Value("${ml.service.url}")
    private String mlUrl;

    @Value("${ml.service.timeout-seconds:30}")
    private int timeoutSeconds;

    @Value("${ml.service.retry-attempts:2}")
    private int retryAttempts;

    private final ObjectMapper mapper = new ObjectMapper();

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public Map<String, Object> predict(Map<String, Object> payload) {
        return callWithRetry("/predict", payload);
    }

    public Map<String, Object> simulate(Map<String, Object> payload) {
        return callWithRetry("/simulate", payload);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callWithRetry(String path, Map<String, Object> payload) {
        Exception lastException = null;

        for (int attempt = 1; attempt <= retryAttempts; attempt++) {
            try {
                String body = mapper.writeValueAsString(payload);
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(mlUrl + path))
                        .header("Content-Type", "application/json")
                        .timeout(Duration.ofSeconds(timeoutSeconds))
                        .POST(HttpRequest.BodyPublishers.ofString(body))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() >= 400) {
                    throw new BusinessException("ML service returned error: HTTP " + response.statusCode(),
                            HttpStatus.BAD_GATEWAY);
                }

                log.debug("ML service call to {} succeeded on attempt {}", path, attempt);
                return mapper.readValue(response.body(), Map.class);

            } catch (BusinessException be) {
                throw be;
            } catch (Exception e) {
                lastException = e;
                log.warn("ML service call to {} failed on attempt {}/{}: {}", path, attempt, retryAttempts, e.getMessage());
                if (attempt < retryAttempts) {
                    try { Thread.sleep(500L * attempt); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                }
            }
        }

        log.error("ML service unavailable after {} attempts: {}", retryAttempts, lastException.getMessage());
        throw new BusinessException(
                "Prediction service is temporarily unavailable. Please try again later.",
                HttpStatus.SERVICE_UNAVAILABLE
        );
    }
}
