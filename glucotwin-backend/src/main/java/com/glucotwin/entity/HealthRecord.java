package com.glucotwin.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "health_records", indexes = {
        @Index(name = "idx_health_user_date", columnList = "user_id, created_at")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealthRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(length = 20)
    private String gender;

    private Double age;

    @Column(nullable = false)
    @Builder.Default
    private Boolean hypertension = false;

    @Column(name = "heart_disease", nullable = false)
    @Builder.Default
    private Boolean heartDisease = false;

    @Column(name = "smoking_history", length = 30)
    private String smokingHistory;

    private Double bmi;

    @Column(name = "hba1c_level")
    private Double hba1cLevel;

    @Column(name = "blood_glucose_level")
    private Double bloodGlucoseLevel;

    @Column(name = "risk_percentage")
    private Integer riskPercentage;

    @Column(name = "risk_level", length = 10)
    private String riskLevel;

    @Column(length = 30)
    private String prediction;

    @Column(name = "factors_json", columnDefinition = "TEXT")
    private String factorsJson;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /** Expose userId in JSON without serialising the full User object. */
    public Long getUserId() {
        return user != null ? user.getId() : null;
    }
}
