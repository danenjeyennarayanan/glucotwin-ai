-- V1__initial_schema.sql
-- GlucoTwin AI - Initial Database Schema (Managed by Flyway)

CREATE TABLE IF NOT EXISTS users (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(120)         NOT NULL,
    email      VARCHAR(255)         NOT NULL UNIQUE,
    password   VARCHAR(255)         NOT NULL,
    role       ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
    created_at DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS health_records (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT          NOT NULL,
    gender              VARCHAR(20),
    age                 DECIMAL(5, 1),
    hypertension        TINYINT(1)      NOT NULL DEFAULT 0,
    heart_disease       TINYINT(1)      NOT NULL DEFAULT 0,
    smoking_history     VARCHAR(30),
    bmi                 DECIMAL(5, 2),
    hba1c_level         DECIMAL(4, 1),
    blood_glucose_level DECIMAL(6, 1),
    risk_percentage     INT,
    risk_level          ENUM('Low','Medium','High'),
    prediction          VARCHAR(30),
    factors_json        TEXT,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_health_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_health_user_date (user_id, created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recommendations (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    risk_level          ENUM('Low','Medium','High') NOT NULL,
    recommendation_text TEXT                        NOT NULL,
    created_at          DATETIME                    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_recommendations_risk (risk_level)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
