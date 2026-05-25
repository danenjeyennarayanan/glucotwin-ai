"""
predict.py — Standalone prediction script for GlucoTwin AI

Usage:
    python predict.py --gender Male --age 45 --hypertension 0 --heart-disease 0 \
                      --smoking never --bmi 28.5 --hba1c 6.1 --glucose 140

    python predict.py --help

This script loads the trained model and SHAP explainer from model/ and
runs a single prediction, printing the risk percentage, level, and top
contributing factors to stdout.

Run train.py first to generate the model pickle files.
"""

import argparse
import logging
import os
import pickle
import sys
import warnings

import numpy as np
import shap

warnings.filterwarnings("ignore")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("glucotwin-predict")

# ── Must match train.py and ml_service.py exactly ─────────────────────────
SMOKING_MAP = {
    "never": 0, "No Info": 0, "not current": 1,
    "ever": 2, "former": 3, "current": 4,
}
GENDER_MAP = {"Female": 0, "Male": 1, "Other": 2}

DISPLAY_NAMES = [
    "Gender", "Age", "Hypertension", "Heart Disease",
    "Smoking History", "BMI", "HbA1c Level", "Blood Glucose Level",
]


def load_artifacts(model_path: str, explainer_path: str):
    if not os.path.exists(model_path):
        logger.error(
            f"Model not found at '{model_path}'. Run train.py first:\n"
            "    python train.py"
        )
        sys.exit(1)
    if not os.path.exists(explainer_path):
        logger.error(
            f"SHAP explainer not found at '{explainer_path}'. Run train.py first:\n"
            "    python train.py"
        )
        sys.exit(1)

    with open(model_path, "rb") as f:
        model = pickle.load(f)
    with open(explainer_path, "rb") as f:
        explainer = pickle.load(f)

    logger.info(f"Model loaded from {model_path}")
    return model, explainer


def preprocess(args) -> np.ndarray:
    gender        = GENDER_MAP.get(args.gender, 1)
    smoking       = SMOKING_MAP.get(args.smoking, 0)
    return np.array([[
        gender,
        float(args.age),
        int(args.hypertension),
        int(args.heart_disease),
        smoking,
        float(args.bmi),
        float(args.hba1c),
        float(args.glucose),
    ]])


def classify_risk(prob: float) -> str:
    pct = prob * 100
    if pct <= 30:
        return "Low"
    elif pct <= 60:
        return "Medium"
    return "High"


def run_prediction(args):
    model, explainer = load_artifacts(args.model_path, args.explainer_path)

    X = preprocess(args)

    proba         = model.predict_proba(X)[0]
    diabetic_prob = float(proba[1])
    risk_pct      = min(round(diabetic_prob * 100), 99)
    risk_level    = classify_risk(diabetic_prob)
    prediction    = "Diabetic" if diabetic_prob >= 0.5 else "Non-Diabetic"

    # SHAP explanability
    shap_values = explainer.shap_values(X)
    sv = shap_values[1][0] if isinstance(shap_values, list) else shap_values[0]
    total_abs = sum(abs(v) for v in sv) or 1.0

    factors = sorted(
        [
            {
                "feature":   DISPLAY_NAMES[i],
                "impact":    round((abs(sv[i]) / total_abs) * 100),
                "direction": "increases risk" if sv[i] > 0 else "decreases risk",
            }
            for i in range(len(sv))
            if round((abs(sv[i]) / total_abs) * 100) > 0
        ],
        key=lambda x: x["impact"],
        reverse=True,
    )

    print("\n" + "=" * 50)
    print("  GlucoTwin AI — Prediction Result")
    print("=" * 50)
    print(f"  Diabetes Risk  : {risk_pct}%")
    print(f"  Risk Level     : {risk_level} Risk")
    print(f"  Prediction     : {prediction}")
    print(f"  Confidence     : {round(diabetic_prob * 100, 1)}%")
    print()
    print("  Top Contributing Factors:")
    for i, f in enumerate(factors[:5], 1):
        bar = "█" * (f["impact"] // 5)
        print(f"  {i}. {f['feature']:<22} {f['impact']:>3}%  {bar}  ({f['direction']})")
    print("=" * 50)
    print("  ⚠  This is AI-assisted and NOT a medical diagnosis.")
    print("     Please consult a qualified healthcare professional.")
    print("=" * 50 + "\n")


def main():
    parser = argparse.ArgumentParser(
        description="GlucoTwin AI — standalone diabetes risk predictor",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--gender",       default="Male",  choices=["Male", "Female", "Other"])
    parser.add_argument("--age",          type=float, default=40,    help="Age in years")
    parser.add_argument("--hypertension", type=int,   default=0,     choices=[0, 1])
    parser.add_argument("--heart-disease",type=int,   default=0,     choices=[0, 1], dest="heart_disease")
    parser.add_argument("--smoking",      default="never",
                        choices=["never", "No Info", "not current", "ever", "former", "current"])
    parser.add_argument("--bmi",          type=float, default=25.0,  help="Body Mass Index")
    parser.add_argument("--hba1c",        type=float, default=5.5,   help="HbA1c level (%)")
    parser.add_argument("--glucose",      type=float, default=100.0, help="Blood glucose level (mg/dL)")
    parser.add_argument("--model-path",   default=os.environ.get("MODEL_PATH", "model/diabetes_model.pkl"))
    parser.add_argument("--explainer-path", default=os.environ.get("EXPLAINER_PATH", "model/shap_explainer.pkl"))

    args = parser.parse_args()
    run_prediction(args)


if __name__ == "__main__":
    main()
