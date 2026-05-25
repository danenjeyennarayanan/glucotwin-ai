-- V1__initial_schema.sql
-- GlucoTwin AI - Initial Database Schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(120)         NOT NULL,
    email      VARCHAR(255)         NOT NULL UNIQUE,
    password   VARCHAR(255)         NOT NULL,
    role       VARCHAR(10)          NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP            NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS health_records (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT          NOT NULL,
    gender              VARCHAR(20),
    age                 DECIMAL(5, 1),
    hypertension        BOOLEAN         NOT NULL DEFAULT FALSE,
    heart_disease       BOOLEAN         NOT NULL DEFAULT FALSE,
    smoking_history     VARCHAR(30),
    bmi                 DECIMAL(5, 2),
    hba1c_level         DECIMAL(4, 1),
    blood_glucose_level DECIMAL(6, 1),
    risk_percentage     INT,
    risk_level          VARCHAR(10),
    prediction          VARCHAR(30),
    factors_json        TEXT,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_health_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_health_user_date ON health_records(user_id, created_at);

CREATE TABLE IF NOT EXISTS recommendations (
    id                  BIGSERIAL PRIMARY KEY,
    risk_level          VARCHAR(10)     NOT NULL,
    recommendation_text TEXT            NOT NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recommendations_risk ON recommendations(risk_level);