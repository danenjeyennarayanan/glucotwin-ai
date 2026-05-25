"""
shap_analysis.py — Standalone SHAP explainability module for GlucoTwin AI

Usage (standalone analysis / debugging):
    python shap_analysis.py

This module is also imported by ml_service.py for per-prediction SHAP
factor extraction. It provides:

  - compute_shap_factors()  — compute per-prediction factor contributions
  - run_global_analysis()   — generate a global feature importance summary
                              (bar plot saved to shap_summary.png)
"""

import logging
import os
import pickle
import sys
import warnings
from typing import Any

import numpy as np

warnings.filterwarnings("ignore")

logger = logging.getLogger("glucotwin-shap")

# ── Paths (mirror ml_service.py defaults) ─────────────────────────────────
MODEL_PATH     = os.environ.get("MODEL_PATH",     "model/diabetes_model.pkl")
EXPLAINER_PATH = os.environ.get("EXPLAINER_PATH", "model/shap_explainer.pkl")
DATASET_PATH   = os.environ.get("DATASET_PATH",   "diabetes_prediction_dataset.csv")

FEATURE_DISPLAY_NAMES = [
    "Gender",
    "Age",
    "Hypertension",
    "Heart Disease",
    "Smoking History",
    "BMI",
    "HbA1c Level",
    "Blood Glucose Level",
]

# ── Core function used by ml_service.py ───────────────────────────────────

def compute_shap_factors(
    explainer: Any,
    feature_vector: np.ndarray,
    n_top: int = 5,
) -> list[dict]:
    """
    Compute SHAP values for a single prediction and return the top-N
    factors as a list of dicts:
        [{"feature": "Blood Glucose Level", "impact": 41}, ...]

    Parameters
    ----------
    explainer      : shap.TreeExplainer instance
    feature_vector : 1-D numpy array of encoded feature values (8 features)
    n_top          : number of top factors to return (default 5)

    Returns
    -------
    List of factor dicts sorted by descending absolute impact (0–100 scale).
    """
    try:
        shap_values = explainer.shap_values(feature_vector.reshape(1, -1))

        # shap_values may be a list [class_0_vals, class_1_vals] for binary RF
        if isinstance(shap_values, list) and len(shap_values) == 2:
            vals = shap_values[1][0]   # class-1 (diabetic) SHAP values
        else:
            vals = np.array(shap_values)[0]

        # Convert raw SHAP values → 0–100 percentage impact
        abs_vals   = np.abs(vals)
        total      = abs_vals.sum() or 1.0
        pct_impact = (abs_vals / total * 100).astype(int)

        factors = [
            {
                "feature": FEATURE_DISPLAY_NAMES[i],
                "impact":  int(pct_impact[i]),
            }
            for i in range(len(FEATURE_DISPLAY_NAMES))
        ]
        # Sort by descending impact, return top-N
        factors.sort(key=lambda x: x["impact"], reverse=True)
        return factors[:n_top]

    except Exception as exc:
        logger.warning(f"SHAP computation failed: {exc} — returning empty factors")
        return []


# ── Standalone global analysis ─────────────────────────────────────────────

def run_global_analysis() -> None:
    """
    Load the saved model + dataset and generate a global SHAP summary plot
    (saved as shap_summary.png in the working directory).

    Run this independently for exploratory analysis or debugging:
        python shap_analysis.py
    """
    import shap
    import pandas as pd

    if not os.path.exists(MODEL_PATH):
        logger.error(f"Model not found at '{MODEL_PATH}'. Run train.py first.")
        sys.exit(1)

    if not os.path.exists(DATASET_PATH):
        logger.error(f"Dataset not found at '{DATASET_PATH}'.")
        sys.exit(1)

    logger.info("Loading model…")
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)

    logger.info("Loading dataset for global SHAP analysis…")
    df = pd.read_csv(DATASET_PATH)

    SMOKING_MAP = {"never": 0, "No Info": 0, "not current": 1, "ever": 2, "former": 3, "current": 4}
    GENDER_MAP  = {"Female": 0, "Male": 1, "Other": 2}

    df["gender_enc"]  = df["gender"].map(GENDER_MAP).fillna(1).astype(int)
    df["smoking_enc"] = df["smoking_history"].map(SMOKING_MAP).fillna(0).astype(int)

    FEATURES = [
        "gender_enc", "age", "hypertension", "heart_disease",
        "smoking_enc", "bmi", "HbA1c_level", "blood_glucose_level",
    ]
    X = df[FEATURES].values

    # Use a 500-row sample for speed
    sample_size = min(500, len(X))
    X_sample = X[:sample_size]

    logger.info(f"Computing SHAP values for {sample_size} samples…")
    explainer  = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_sample)

    # Class-1 (diabetic) SHAP values
    sv = shap_values[1] if isinstance(shap_values, list) else shap_values

    # Mean absolute SHAP per feature
    mean_abs = np.abs(sv).mean(axis=0)
    logger.info("\nGlobal feature importance (mean |SHAP|):")
    for name, val in sorted(zip(FEATURE_DISPLAY_NAMES, mean_abs), key=lambda x: -x[1]):
        bar = "█" * int(val * 100)
        logger.info(f"  {name:<25} {val:.4f}  {bar}")

    # Try to save plot if matplotlib is available
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        fig, ax = plt.subplots(figsize=(10, 6))
        sorted_pairs = sorted(zip(FEATURE_DISPLAY_NAMES, mean_abs), key=lambda x: x[1])
        names, vals = zip(*sorted_pairs)
        bars = ax.barh(names, vals, color="#00d4aa")
        ax.set_xlabel("Mean |SHAP value|")
        ax.set_title("GlucoTwin AI — Global Feature Importance (SHAP)")
        ax.set_facecolor("#0a1628")
        fig.patch.set_facecolor("#050d1a")
        for label in ax.get_xticklabels() + ax.get_yticklabels():
            label.set_color("#e8f4f8")
        ax.xaxis.label.set_color("#6b8ca8")
        ax.title.set_color("#e8f4f8")
        ax.spines["bottom"].set_color("#1a2e4a")
        ax.spines["left"].set_color("#1a2e4a")
        ax.tick_params(colors="#6b8ca8")

        out = "shap_summary.png"
        plt.tight_layout()
        plt.savefig(out, dpi=150, facecolor=fig.get_facecolor())
        logger.info(f"SHAP summary plot saved → {out}")
    except ImportError:
        logger.info("matplotlib not installed — skipping plot generation.")


# ── Entry point ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        stream=sys.stdout,
    )
    run_global_analysis()
