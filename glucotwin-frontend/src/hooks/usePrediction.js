// hooks/usePrediction.js — Custom hook for ML prediction
import { useState } from "react";
import API, { ApiError } from "../services/api";

export function usePrediction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const predict = async (form, userId) => {
    setLoading(true);
    setError("");
    try {
      const result = await API.predict(form, userId);
      return {
        riskPercentage: result.risk_percentage,
        riskLevel: result.risk_level,
        prediction: result.prediction,
        confidence: result.confidence,
        disclaimer: result.disclaimer,
        factors: (result.factors || []).map((f) => ({
          feature: f.feature,
          impact: f.impact,
          direction: f.direction,
        })),
        input: form,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Prediction failed. Please check your connection.";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { predict, loading, error, setError };
}
