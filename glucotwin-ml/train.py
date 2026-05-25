"""
train.py — Standalone model training script for GlucoTwin AI

Usage:
    python train.py
    python train.py --dataset path/to/diabetes_prediction_dataset.csv
    python train.py --dataset data.csv --model-path model/diabetes_model.pkl
    python train.py --force   # retrain even if pkl files already exist

This script trains a Random Forest classifier on the Diabetes Prediction
Dataset, evaluates it, and saves both the model and SHAP TreeExplainer
as pickle files into the model/ directory.

Run this ONCE before starting ml_service.py, or let ml_service.py auto-
train on first startup if the pickle files are absent.
"""

import argparse
import logging
import os
import pickle
import sys
import warnings

import numpy as np
import pandas as pd
import shap
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

warnings.filterwarnings("ignore")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("glucotwin-train")

# ── Encoding maps (must match ml_service.py) ──────────────────────────────
SMOKING_MAP = {
    "never": 0, "No Info": 0, "not current": 1,
    "ever": 2, "former": 3, "current": 4,
}
GENDER_MAP = {"Female": 0, "Male": 1, "Other": 2}


def train(dataset_path: str, model_path: str, explainer_path: str, force: bool = False) -> None:
    # ── Skip if already trained (unless --force) ───────────────────────────
    if not force and os.path.exists(model_path) and os.path.exists(explainer_path):
        logger.info(
            f"Pre-trained model found at '{model_path}'. Skipping training.\n"
            "  Run with --force to retrain from scratch."
        )
        return

    # ── Load dataset ───────────────────────────────────────────────────────
    if not os.path.exists(dataset_path):
        logger.error(
            f"Dataset not found at '{dataset_path}'.\n"
            "Download it from: https://www.kaggle.com/datasets/iammustafatz/diabetes-prediction-dataset\n"
            "Then re-run:  python train.py --dataset diabetes_prediction_dataset.csv"
        )
        sys.exit(1)

    df = pd.read_csv(dataset_path)
    logger.info(f"Dataset loaded: {len(df):,} rows, {df.shape[1]} columns")

    # ── Feature engineering ────────────────────────────────────────────────
    df["gender_enc"]  = df["gender"].map(GENDER_MAP).fillna(1).astype(int)
    df["smoking_enc"] = df["smoking_history"].map(SMOKING_MAP).fillna(0).astype(int)

    FEATURES = [
        "gender_enc", "age", "hypertension", "heart_disease",
        "smoking_enc", "bmi", "HbA1c_level", "blood_glucose_level",
    ]

    X = df[FEATURES].values
    y = df["diabetes"].values

    logger.info(f"Class distribution — Non-diabetic: {(y==0).sum():,} | Diabetic: {(y==1).sum():,}")

    # ── Train / test split ─────────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    logger.info(f"Train size: {len(X_train):,} | Test size: {len(X_test):,}")

    # ── Random Forest model ────────────────────────────────────────────────
    logger.info("Training Random Forest classifier…")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
        class_weight="balanced",
    )
    model.fit(X_train, y_train)

    # ── Evaluation ────────────────────────────────────────────────────────
    preds     = model.predict(X_test)
    proba     = model.predict_proba(X_test)[:, 1]
    acc       = accuracy_score(y_test, preds)
    roc_auc   = roc_auc_score(y_test, proba)

    logger.info(f"Accuracy : {acc:.4f}")
    logger.info(f"ROC-AUC  : {roc_auc:.4f}")
    logger.info("\n" + classification_report(
        y_test, preds, target_names=["Non-Diabetic", "Diabetic"]
    ))

    # ── Feature importances ───────────────────────────────────────────────
    DISPLAY_NAMES = [
        "Gender", "Age", "Hypertension", "Heart Disease",
        "Smoking History", "BMI", "HbA1c Level", "Blood Glucose",
    ]
    importances = model.feature_importances_
    logger.info("Feature importances:")
    for name, imp in sorted(zip(DISPLAY_NAMES, importances), key=lambda x: -x[1]):
        logger.info(f"  {name:<22} {imp:.4f}")

    # ── SHAP TreeExplainer ────────────────────────────────────────────────
    logger.info("Building SHAP TreeExplainer (this may take a minute)…")
    explainer = shap.TreeExplainer(model)
    # Smoke-test the explainer on a small sample
    sample_shap = explainer.shap_values(X_test[:5])
    logger.info(f"SHAP explainer verified — output shape: {np.array(sample_shap).shape}")

    # ── Save artefacts ────────────────────────────────────────────────────
    os.makedirs(os.path.dirname(model_path) if os.path.dirname(model_path) else "model", exist_ok=True)

    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    logger.info(f"Model saved → {model_path}")

    with open(explainer_path, "wb") as f:
        pickle.dump(explainer, f)
    logger.info(f"SHAP explainer saved → {explainer_path}")

    logger.info("✅ Training complete. You can now start ml_service.py.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train GlucoTwin AI diabetes model")
    parser.add_argument(
        "--dataset",
        default=os.environ.get("DATASET_PATH", "diabetes_prediction_dataset.csv"),
        help="Path to the diabetes prediction CSV dataset",
    )
    parser.add_argument(
        "--model-path",
        default=os.environ.get("MODEL_PATH", "model/diabetes_model.pkl"),
        help="Output path for the trained model pickle",
    )
    parser.add_argument(
        "--explainer-path",
        default=os.environ.get("EXPLAINER_PATH", "model/shap_explainer.pkl"),
        help="Output path for the SHAP explainer pickle",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force retraining even if pkl files already exist",
    )
    args = parser.parse_args()

    train(args.dataset, args.model_path, args.explainer_path, force=args.force)
