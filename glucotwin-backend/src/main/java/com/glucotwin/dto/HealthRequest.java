package com.glucotwin.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class HealthRequest {

    @NotNull(message = "User ID is required")
    @Positive(message = "User ID must be positive")
    private Long userId;

    @NotBlank(message = "Gender is required")
    private String gender;

    @NotNull(message = "Age is required")
    @Positive(message = "Age must be a positive number")
    @Max(value = 120, message = "Age must be realistic (≤ 120)")
    private Double age;

    @NotNull(message = "Hypertension flag is required")
    private Boolean hypertension;

    @NotNull(message = "Heart disease flag is required")
    private Boolean heartDisease;

    @NotBlank(message = "Smoking history is required")
    private String smokingHistory;

    @NotNull(message = "BMI is required")
    @DecimalMin(value = "10.0", message = "BMI must be at least 10")
    @DecimalMax(value = "100.0", message = "BMI must be at most 100")
    private Double bmi;

    @NotNull(message = "HbA1c level is required")
    @DecimalMin(value = "3.5", message = "HbA1c must be at least 3.5")
    @DecimalMax(value = "15.0", message = "HbA1c must be at most 15.0")
    private Double hba1cLevel;

    @NotNull(message = "Blood glucose level is required")
    @DecimalMin(value = "50.0", message = "Blood glucose must be at least 50")
    @DecimalMax(value = "500.0", message = "Blood glucose must be at most 500")
    private Double bloodGlucoseLevel;
}
