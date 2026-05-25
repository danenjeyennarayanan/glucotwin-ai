"""
GlucoTwin AI — Python ML Service (Production-Hardened)
Flask API | Random Forest | SHAP Explainability

Run (dev):    python ml_service.py
Run (prod):   gunicorn -w 2 -b 0.0.0.0:5001 --timeout 120 ml_service:app
"""

import logging
import os
import pickle
import sys
import time
import warnings

import numpy as np
import pandas as pd
import shap
from flask import Flask, jsonify, request
from flask_cors import CORS
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

warnings.filterwarnings("ignore")

# ── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("glucotwin-ml")

# ── App ────────────────────────────────────────────────────────────────────
app = Flask(__name__)

ALLOWED_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:3000,http://localhost:8080")
CORS(app, origins=[o.strip() for o in ALLOWED_ORIGINS.split(",")])

# ── Paths ──────────────────────────────────────────────────────────────────
MODEL_PATH     = os.environ.get("MODEL_PATH",     "model/diabetes_model.pkl")
EXPLAINER_PATH = os.environ.get("EXPLAINER_PATH", "model/shap_explainer.pkl")
DATASET_PATH   = os.environ.get("DATASET_PATH",   "diabetes_prediction_dataset.csv")

# ── Encoding maps ──────────────────────────────────────────────────────────
SMOKING_MAP = {
    "never": 0, "No Info": 0, "not current": 1,
    "ever": 2, "former": 3, "current": 4,
}
GENDER_MAP = {"Female": 0, "Male": 1, "Other": 2}

DISPLAY_NAMES = {
    "gender":              "Gender",
    "age":                 "Age",
    "hypertension":        "Hypertension",
    "heart_disease":       "Heart Disease",
    "smoking_history":     "Smoking History",
    "bmi":                 "BMI",
    "HbA1c_level":         "HbA1c Level",
    "blood_glucose_level": "Blood Glucose Level",
}
RAW_FEATURE_NAMES = list(DISPLAY_NAMES.keys())

REQUIRED_FIELDS = {
    "gender":              str,
    "age":                 (int, float),
    "hypertension":        (int, bool),
    "heart_disease":       (int, bool),
    "smoking_history":     str,
    "bmi":                 (int, float),
    "HbA1c_level":         (int, float),
    "blood_glucose_level": (int, float),
}


# ── Validation ─────────────────────────────────────────────────────────────
def validate_payload(data: dict) -> list[str]:
    errors = []
    for field, expected_types in REQUIRED_FIELDS.items():
        if field not in data:
            errors.append(f"Missing required field: '{field}'")
            continue
        val = data[field]
        if not isinstance(val, expected_types):
            errors.append(f"Field '{field}' has invalid type (got {type(val).__name__})")

    # Range checks
    if "age" in data:
        try:
            age = float(data["age"])
            if not (0 < age < 130):
                errors.append("'age' must be between 0 and 130")
        except (ValueError, TypeError):
            errors.append("'age' must be numeric")

    if "bmi" in data:
        try:
            bmi = float(data["bmi"])
            if not (10 <= bmi <= 100):
                errors.append("'bmi' must be between 10 and 100")
        except (ValueError, TypeError):
            errors.append("'bmi' must be numeric")

    if "blood_glucose_level" in data:
        try:
            gl = float(data["blood_glucose_level"])
            if not (50 <= gl <= 500):
                errors.append("'blood_glucose_level' must be between 50 and 500")
        except (ValueError, TypeError):
            errors.append("'blood_glucose_level' must be numeric")

    return errors


# ── Preprocessing ──────────────────────────────────────────────────────────
def preprocess(data: dict) -> np.ndarray:
    gender       = GENDER_MAP.get(str(data.get("gender", "Male")), 1)
    age          = float(data.get("age", 40))
    hypertension = int(data.get("hypertension", 0))
    heart_disease = int(data.get("heart_disease", 0))
    smoking      = SMOKING_MAP.get(str(data.get("smoking_history", "never")), 0)
    bmi          = float(data.get("bmi", 25))
    hba1c        = float(data.get("HbA1c_level", 5.5))
    glucose      = float(data.get("blood_glucose_level", 100))
    return np.array([[gender, age, hypertension, heart_disease, smoking, bmi, hba1c, glucose]])


# ── Risk classification ────────────────────────────────────────────────────
def classify_risk(prob: float) -> str:
    pct = prob * 100
    if pct <= 30:
        return "Low"
    elif pct <= 60:
        return "Medium"
    return "High"


# ── Model loading / training ───────────────────────────────────────────────
def load_or_train_model():
    os.makedirs(os.path.dirname(MODEL_PATH) if os.path.dirname(MODEL_PATH) else "model", exist_ok=True)

    if os.path.exists(MODEL_PATH) and os.path.exists(EXPLAINER_PATH):
        logger.info("Loading existing model from disk…")
        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)
        with open(EXPLAINER_PATH, "rb") as f:
            explainer = pickle.load(f)
        logger.info("Model loaded successfully.")
        return model, explainer

    logger.info("No saved model found — training from dataset…")
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(
            f"Dataset not found at '{DATASET_PATH}'. "
            "Set DATASET_PATH env var or place the CSV in the working directory."
        )

    df = pd.read_csv(DATASET_PATH)
    logger.info(f"Dataset loaded: {len(df)} rows")

    df["gender_enc"]  = df["gender"].map(GENDER_MAP).fillna(1).astype(int)
    df["smoking_enc"] = df["smoking_history"].map(SMOKING_MAP).fillna(0).astype(int)

    X = df[["gender_enc", "age", "hypertension", "heart_disease",
            "smoking_enc", "bmi", "HbA1c_level", "blood_glucose_level"]].values
    y = df["diabetes"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=200, max_depth=12, min_samples_split=5,
        min_samples_leaf=2, random_state=42, n_jobs=-1, class_weight="balanced",
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    acc   = accuracy_score(y_test, preds)
    logger.info(f"Model accuracy: {acc:.4f}")
    logger.info("\n" + classification_report(y_test, preds, target_names=["Non-Diabetic", "Diabetic"]))

    logger.info("Building SHAP TreeExplainer…")
    explainer = shap.TreeExplainer(model)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    with open(EXPLAINER_PATH, "wb") as f:
        pickle.dump(explainer, f)

    logger.info("Model and explainer saved.")
    return model, explainer


# Lazy singletons
_model     = None
_explainer = None


def get_model():
    global _model, _explainer
    if _model is None:
        _model, _explainer = load_or_train_model()
    return _model, _explainer


# ── Endpoints ──────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health_check():
    model_loaded = _model is not None
    return jsonify({
        "status": "ok",
        "service": "GlucoTwin ML API",
        "version": "1.0.0",
        "model_loaded": model_loaded,
    })


@app.route("/predict", methods=["POST"])
def predict():
    start = time.time()
    try:
        payload = request.get_json(force=True, silent=True)
        if not payload:
            return jsonify({"error": "Request body must be valid JSON"}), 400

        errors = validate_payload(payload)
        if errors:
            logger.warning(f"Validation errors in /predict: {errors}")
            return jsonify({"error": "Validation failed", "details": errors}), 422

        model, explainer = get_model()
        X = preprocess(payload)

        proba        = model.predict_proba(X)[0]
        diabetic_prob = float(proba[1])
        risk_pct     = min(round(diabetic_prob * 100), 99)
        risk_level   = classify_risk(diabetic_prob)
        prediction   = "Diabetic" if diabetic_prob >= 0.5 else "Non-Diabetic"

        shap_values = explainer.shap_values(X)
        sv = shap_values[1][0] if isinstance(shap_values, list) else shap_values[0]

        total_abs = sum(abs(v) for v in sv) or 1.0
        factors = [
            {
                "feature":    DISPLAY_NAMES[name],
                "impact":     round((abs(sv[i]) / total_abs) * 100),
                "shap_value": round(float(sv[i]), 4),
                "direction":  "increases" if sv[i] > 0 else "decreases",
            }
            for i, name in enumerate(RAW_FEATURE_NAMES)
        ]
        factors = sorted([f for f in factors if f["impact"] > 0],
                         key=lambda x: x["impact"], reverse=True)

        elapsed = round((time.time() - start) * 1000)
        logger.info(f"/predict completed in {elapsed}ms — risk={risk_level} ({risk_pct}%)")

        return jsonify({
            "risk_percentage": risk_pct,
            "risk_level":      risk_level,
            "prediction":      prediction,
            "confidence":      round(diabetic_prob, 4),
            "factors":         factors,
        })

    except Exception as e:
        logger.exception(f"Error in /predict: {e}")
        return jsonify({"error": "Internal prediction error. Please try again."}), 500


@app.route("/simulate", methods=["POST"])
def simulate():
    try:
        payload = request.get_json(force=True, silent=True)
        if not payload or "base" not in payload or "modified" not in payload:
            return jsonify({"error": "Body must contain 'base' and 'modified' objects"}), 400

        base_errors     = validate_payload(payload["base"])
        modified_errors = validate_payload(payload["modified"])
        if base_errors or modified_errors:
            return jsonify({
                "error": "Validation failed",
                "base_errors": base_errors,
                "modified_errors": modified_errors,
            }), 422

        model, _ = get_model()
        results  = {}

        for key in ("base", "modified"):
            X     = preprocess(payload[key])
            proba = model.predict_proba(X)[0][1]
            results[key] = {
                "risk_percentage": min(round(proba * 100), 99),
                "risk_level":      classify_risk(proba),
                "prediction":      "Diabetic" if proba >= 0.5 else "Non-Diabetic",
            }

        diff             = results["modified"]["risk_percentage"] - results["base"]["risk_percentage"]
        results["change"]   = diff
        results["improved"] = diff < 0

        logger.info(f"/simulate completed — change={diff}%")
        return jsonify(results)

    except Exception as e:
        logger.exception(f"Error in /simulate: {e}")
        return jsonify({"error": "Internal simulation error. Please try again."}), 500


@app.route("/feature-importance", methods=["GET"])
def feature_importance():
    try:
        model, _ = get_model()
        importances = model.feature_importances_
        display = ["Gender", "Age", "Hypertension", "Heart Disease",
                   "Smoking History", "BMI", "HbA1c Level", "Blood Glucose Level"]
        data = sorted(
            [{"feature": n, "importance": round(float(v), 4)} for n, v in zip(display, importances)],
            key=lambda x: x["importance"], reverse=True,
        )
        return jsonify({"feature_importance": data})

    except Exception as e:
        logger.exception(f"Error in /feature-importance: {e}")
        return jsonify({"error": "Could not retrieve feature importance."}), 500


# ── Error handlers ─────────────────────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Method not allowed"}), 405


@app.errorhandler(500)
def internal_error(e):
    logger.error(f"Unhandled 500: {e}")
    return jsonify({"error": "Internal server error"}), 500


# ── Entry point ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    logger.info("=" * 55)
    logger.info("  GlucoTwin AI — Machine Learning Service")
    logger.info("  Endpoints: /health  /predict  /simulate  /feature-importance")
    logger.info("=" * 55)

    port  = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("DEBUG", "false").lower() == "true"

    try:
        get_model()
    except FileNotFoundError as e:
        logger.warning(str(e))
        logger.warning("Model will be trained on first request if dataset is present.")

    app.run(host="0.0.0.0", port=port, debug=debug)
