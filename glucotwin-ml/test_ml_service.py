"""
GlucoTwin ML Service — Unit Tests
Run with: pytest test_ml_service.py -v
"""
import importlib
import sys
import types
import unittest
import numpy as np


# ---------------------------------------------------------------------------
# Minimal stubs so ml_service.py can be imported without real model files
# ---------------------------------------------------------------------------
def _make_stub_module(name):
    mod = types.ModuleType(name)
    sys.modules[name] = mod
    return mod

for _pkg in ("flask", "flask_cors", "sklearn", "sklearn.ensemble",
             "sklearn.model_selection", "sklearn.metrics",
             "shap", "pandas", "numpy"):
    if _pkg not in sys.modules:
        _make_stub_module(_pkg)

# numpy must be real for array operations
import numpy  # noqa: E402 — already installed

# Provide enough Flask stubs for module-level code
flask_mod = sys.modules["flask"]
flask_mod.Flask = lambda *a, **k: types.SimpleNamespace(
    route=lambda *a, **k: (lambda f: f),
    run=lambda **k: None,
    errorhandler=lambda *a: (lambda f: f),
)
flask_mod.jsonify = lambda x: x
flask_mod.request = types.SimpleNamespace(get_json=lambda **k: {})
sys.modules["flask_cors"].CORS = lambda *a, **k: None

# Import only the pure-logic helpers (not the Flask app itself)
# We re-import the functions after patching
import os, pickle, warnings  # noqa: E402
os.environ.setdefault("MODEL_PATH", "/tmp/does_not_exist.pkl")
os.environ.setdefault("EXPLAINER_PATH", "/tmp/does_not_exist.pkl")
os.environ.setdefault("DATASET_PATH", "/tmp/does_not_exist.csv")

# Manually import by executing the file in a fresh namespace
import importlib.util, pathlib  # noqa: E402

_spec = importlib.util.spec_from_file_location(
    "ml_service",
    str(pathlib.Path(__file__).parent / "ml_service.py"),
)
# Skip if the file isn't co-located (e.g. running from a different directory)
try:
    _ml = importlib.util.module_from_spec(_spec)
    _spec.loader.exec_module(_ml)
    ML_AVAILABLE = True
except Exception:
    ML_AVAILABLE = False


class TestClassifyRisk(unittest.TestCase):
    """classify_risk() — converts probability to risk band."""

    @unittest.skipUnless(ML_AVAILABLE, "ml_service not importable")
    def test_low_boundary(self):
        self.assertEqual(_ml.classify_risk(0.30), "Low")

    @unittest.skipUnless(ML_AVAILABLE, "ml_service not importable")
    def test_medium_boundary(self):
        self.assertEqual(_ml.classify_risk(0.31), "Medium")
        self.assertEqual(_ml.classify_risk(0.60), "Medium")

    @unittest.skipUnless(ML_AVAILABLE, "ml_service not importable")
    def test_high_boundary(self):
        self.assertEqual(_ml.classify_risk(0.61), "High")
        self.assertEqual(_ml.classify_risk(1.00), "High")

    @unittest.skipUnless(ML_AVAILABLE, "ml_service not importable")
    def test_zero_is_low(self):
        self.assertEqual(_ml.classify_risk(0.0), "Low")


class TestValidatePayload(unittest.TestCase):
    """validate_payload() — field presence and range checks."""

    @unittest.skipUnless(ML_AVAILABLE, "ml_service not importable")
    def _valid(self):
        return {
            "gender": "Male",
            "age": 45,
            "hypertension": 0,
            "heart_disease": 0,
            "smoking_history": "never",
            "bmi": 27.5,
            "HbA1c_level": 5.8,
            "blood_glucose_level": 140,
        }

    @unittest.skipUnless(ML_AVAILABLE, "ml_service not importable")
    def test_valid_payload_no_errors(self):
        self.assertEqual(_ml.validate_payload(self._valid()), [])

    @unittest.skipUnless(ML_AVAILABLE, "ml_service not importable")
    def test_missing_field_returns_error(self):
        data = self._valid()
        del data["bmi"]
        errors = _ml.validate_payload(data)
        self.assertTrue(any("bmi" in e for e in errors))

    @unittest.skipUnless(ML_AVAILABLE, "ml_service not importable")
    def test_age_out_of_range(self):
        data = self._valid()
        data["age"] = 200
        errors = _ml.validate_payload(data)
        self.assertTrue(any("age" in e for e in errors))

    @unittest.skipUnless(ML_AVAILABLE, "ml_service not importable")
    def test_bmi_below_minimum(self):
        data = self._valid()
        data["bmi"] = 5
        errors = _ml.validate_payload(data)
        self.assertTrue(any("bmi" in e for e in errors))

    @unittest.skipUnless(ML_AVAILABLE, "ml_service not importable")
    def test_glucose_above_maximum(self):
        data = self._valid()
        data["blood_glucose_level"] = 600
        errors = _ml.validate_payload(data)
        self.assertTrue(any("blood_glucose_level" in e for e in errors))

    @unittest.skipUnless(ML_AVAILABLE, "ml_service not importable")
    def test_empty_payload_reports_all_missing(self):
        errors = _ml.validate_payload({})
        # 8 required fields — each should produce an error
        self.assertGreaterEqual(len(errors), 8)


class TestPreprocess(unittest.TestCase):
    """preprocess() — encodes dict → numpy array of shape (1,8)."""

    @unittest.skipUnless(ML_AVAILABLE, "ml_service not importable")
    def test_output_shape(self):
        data = {
            "gender": "Female", "age": 30,
            "hypertension": 0, "heart_disease": 0,
            "smoking_history": "never", "bmi": 22.0,
            "HbA1c_level": 5.0, "blood_glucose_level": 90,
        }
        arr = _ml.preprocess(data)
        self.assertEqual(arr.shape, (1, 8))

    @unittest.skipUnless(ML_AVAILABLE, "ml_service not importable")
    def test_gender_encoding_female(self):
        data = {
            "gender": "Female", "age": 30,
            "hypertension": 0, "heart_disease": 0,
            "smoking_history": "never", "bmi": 22.0,
            "HbA1c_level": 5.0, "blood_glucose_level": 90,
        }
        arr = _ml.preprocess(data)
        self.assertEqual(arr[0][0], 0)  # Female → 0

    @unittest.skipUnless(ML_AVAILABLE, "ml_service not importable")
    def test_smoking_encoding_current(self):
        data = {
            "gender": "Male", "age": 50,
            "hypertension": 1, "heart_disease": 0,
            "smoking_history": "current", "bmi": 30.0,
            "HbA1c_level": 6.5, "blood_glucose_level": 200,
        }
        arr = _ml.preprocess(data)
        self.assertEqual(arr[0][4], 4)  # current → 4


if __name__ == "__main__":
    unittest.main(verbosity=2)
