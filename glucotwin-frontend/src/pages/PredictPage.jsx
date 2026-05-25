// pages/PredictPage.jsx — Multi-step health prediction form
import { useState } from "react";
import { Brain, RefreshCw } from "lucide-react";
import { usePrediction } from "../hooks/usePrediction";

export default function PredictPage({ onResult, user }) {
  const [form, setForm] = useState({
    gender: "Male", age: 45, hypertension: false, heartDisease: false,
    smoking: "never", bmi: 27, hba1c: 5.5, glucose: 120,
  });
  const [step, setStep] = useState(0);
  const { predict, loading, error } = usePrediction();

  const fields = [
    [
      { key: "gender", label: "Biological Gender", type: "select", options: ["Male", "Female", "Other"] },
      { key: "age", label: "Age (years)", type: "range", min: 1, max: 100, step: 1 },
    ],
    [
      { key: "hypertension", label: "Hypertension (High Blood Pressure)", type: "toggle" },
      { key: "heartDisease", label: "Heart Disease History", type: "toggle" },
      { key: "smoking", label: "Smoking History", type: "select", options: ["never", "No Info", "current", "former", "ever"] },
    ],
    [
      { key: "bmi", label: "BMI (Body Mass Index)", type: "range", min: 10, max: 60, step: 0.1, info: "Normal: 18.5–24.9 | Overweight: 25–29.9 | Obese: 30+" },
      { key: "hba1c", label: "HbA1c Level (%)", type: "range", min: 3.5, max: 15, step: 0.1, info: "Normal: <5.7% | Pre-diabetic: 5.7–6.4% | Diabetic: ≥6.5%" },
      { key: "glucose", label: "Blood Glucose Level (mg/dL)", type: "range", min: 50, max: 400, step: 1, info: "Normal: <100 | Pre-diabetic: 100–125 | Diabetic: ≥126" },
    ],
  ];

  const stepTitles = ["Personal Info", "Medical History", "Biomarkers"];

  async function handlePredict() {
    const result = await predict(form, user.userId);
    if (result) onResult(result);
  }

  return (
    <div style={{ maxWidth: 740 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>AI Health Assessment</h1>
      <p style={{ color: "#6b8ca8", marginBottom: 36 }}>
        Enter your health data for an instant diabetes risk prediction powered by machine learning.
      </p>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 8, marginBottom: 36 }}>
        {stepTitles.map((t, i) => (
          <div key={i} onClick={() => setStep(i)} style={{ flex: 1, cursor: "pointer" }}>
            <div style={{ height: 4, borderRadius: 2, background: i <= step ? "#00d4aa" : "#1a2e4a", marginBottom: 8, transition: "background 0.3s" }} />
            <div style={{ fontSize: 12, color: i === step ? "#00d4aa" : "#6b8ca8", fontWeight: i === step ? 700 : 400 }}>{t}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#0a1628", border: "1px solid #1a2e4a", borderRadius: 20, padding: "32px" }}>
        {fields[step].map((field) => (
          <div key={field.key} style={{ marginBottom: 28 }}>
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
              <span>{field.label}</span>
              {field.type === "range" && (
                <span style={{ color: "#00d4aa", fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700 }}>{form[field.key]}</span>
              )}
            </label>
            {field.info && (
              <div style={{ fontSize: 12, color: "#6b8ca8", marginBottom: 10, background: "#0f1f3d", padding: "8px 12px", borderRadius: 8 }}>{field.info}</div>
            )}
            {field.type === "range" && (
              <input type="range" min={field.min} max={field.max} step={field.step} value={form[field.key]}
                onChange={(e) => setForm({ ...form, [field.key]: parseFloat(e.target.value) })}
                style={{ width: "100%", accentColor: "#00d4aa", height: 6 }} />
            )}
            {field.type === "select" && (
              <select value={form[field.key]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                style={{ width: "100%", background: "#0f1f3d", border: "1px solid #1a2e4a", borderRadius: 10, padding: "12px 16px", color: "#e8f4f8", fontSize: 14, outline: "none" }}>
                {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            )}
            {field.type === "toggle" && (
              <div style={{ display: "flex", gap: 12 }}>
                {[true, false].map((v) => (
                  <button key={String(v)} onClick={() => setForm({ ...form, [field.key]: v })}
                    style={{
                      flex: 1, padding: "12px", borderRadius: 10,
                      border: `1px solid ${form[field.key] === v ? "#00d4aa" : "#1a2e4a"}`,
                      background: form[field.key] === v ? "rgba(0,212,170,0.1)" : "transparent",
                      color: form[field.key] === v ? "#00d4aa" : "#6b8ca8",
                      cursor: "pointer", fontWeight: 600, fontSize: 14,
                    }}>
                    {v ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {error && (
          <div style={{ background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)", borderRadius: 10, padding: "12px 16px", color: "#ff4757", marginBottom: 12, fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)}
              style={{ flex: 1, padding: "14px", background: "transparent", border: "1px solid #1a2e4a", borderRadius: 12, color: "#e8f4f8", cursor: "pointer", fontWeight: 600 }}>
              ← Back
            </button>
          )}
          {step < 2 ? (
            <button onClick={() => setStep((s) => s + 1)}
              style={{ flex: 1, padding: "14px", background: "linear-gradient(135deg,#00d4aa,#6c63ff)", border: "none", borderRadius: 12, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>
              Continue →
            </button>
          ) : (
            <button onClick={handlePredict} disabled={loading}
              style={{
                flex: 1, padding: "14px",
                background: loading ? "#1a2e4a" : "linear-gradient(135deg,#00d4aa,#6c63ff)",
                border: "none", borderRadius: 12, color: "#fff",
                cursor: loading ? "default" : "pointer", fontWeight: 700, fontSize: 15,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}>
              {loading
                ? <><RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} /> Analyzing...</>
                : <><Brain size={18} /> Run AI Prediction</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
