// pages/DigitalTwinPage.jsx — Digital Twin health simulator
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, RefreshCw, Sliders } from "lucide-react";
import API from "../services/api";
import { RISK_CONFIG } from "../services/constants";

export default function DigitalTwinPage({ latestResult }) {
  const base = latestResult?.input || {
    gender: "Male", age: 45, hypertension: false, heartDisease: false,
    smoking: "never", bmi: 27, hba1c: 5.5, glucose: 120,
  };

  const [sim, setSim] = useState({ ...base });
  const [simResult, setSimResult] = useState(
    latestResult
      ? { riskPercentage: latestResult.riskPercentage, riskLevel: latestResult.riskLevel, prediction: latestResult.prediction }
      : null
  );
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState("");

  // Debounced simulate — calls Spring Boot → ML service
  useEffect(() => {
    const timer = setTimeout(async () => {
      setSimLoading(true);
      setSimError("");
      try {
        const data = await API.simulate(base, sim);
        setSimResult({
          riskPercentage: data.modified?.risk_percentage,
          riskLevel: data.modified?.risk_level,
          prediction: data.modified?.prediction,
        });
      } catch (err) {
        setSimError(err?.message || "Simulation unavailable. Please check your connection.");
      } finally {
        setSimLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [sim]);

  const baseResult = latestResult
    ? { riskPercentage: latestResult.riskPercentage, riskLevel: latestResult.riskLevel, prediction: latestResult.prediction }
    : null;

  const diff = simResult && baseResult ? simResult.riskPercentage - baseResult.riskPercentage : 0;
  const simCfg = simResult ? RISK_CONFIG[simResult.riskLevel] : RISK_CONFIG["Low"];

  const sliders = [
    { key: "bmi",     label: "BMI",                   min: 15,  max: 50,  step: 0.5, info: "Normal: 18.5–24.9" },
    { key: "glucose", label: "Blood Glucose (mg/dL)", min: 70,  max: 350, step: 1,   info: "Normal: <100" },
    { key: "hba1c",   label: "HbA1c (%)",             min: 3.5, max: 12,  step: 0.1, info: "Normal: <5.7%" },
  ];

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Digital Twin Simulator</h1>
        <p style={{ color: "#6b8ca8" }}>
          Adjust your health parameters to simulate how lifestyle changes affect your diabetes risk in real-time.
        </p>
      </div>

      {simError && (
        <div style={{ background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)", borderRadius: 12, padding: "14px 18px", color: "#ff4757", marginBottom: 20, fontSize: 14 }}>
          ⚠ {simError}
        </div>
      )}

      {/* Before / After */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Baseline */}
        <div style={{ background: "#0a1628", border: "1px solid #1a2e4a", borderRadius: 20, padding: "28px" }}>
          <div style={{ fontSize: 12, color: "#6b8ca8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>📊 Baseline Profile</div>
          {baseResult ? (
            <>
              <div style={{ fontSize: 48, fontWeight: 900, color: RISK_CONFIG[baseResult.riskLevel]?.color, fontFamily: "'Space Mono', monospace" }}>{baseResult.riskPercentage}%</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: RISK_CONFIG[baseResult.riskLevel]?.color }}>{baseResult.riskLevel} Risk</div>
            </>
          ) : (
            <div style={{ color: "#6b8ca8", fontSize: 14 }}>Run a prediction first to set your baseline.</div>
          )}
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {[["BMI", base.bmi, "kg/m²"], ["Glucose", base.glucose, "mg/dL"], ["HbA1c", base.hba1c, "%"]].map(([l, v, u]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#6b8ca8" }}>{l}</span>
                <span style={{ fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>{v}{u}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Simulated */}
        <div style={{ background: "#0a1628", border: `1px solid ${simCfg.color}40`, borderRadius: 20, padding: "28px" }}>
          <div style={{ fontSize: 12, color: "#6b8ca8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
            🤖 Simulated Profile{" "}
            {simLoading && <span style={{ fontSize: 11, color: "#00d4aa" }}>calculating…</span>}
          </div>
          {simLoading && !simResult ? (
            <div style={{ color: "#6b8ca8", fontSize: 14 }}>Calculating…</div>
          ) : simResult ? (
            <>
              <div style={{ fontSize: 48, fontWeight: 900, color: simCfg.color, fontFamily: "'Space Mono', monospace" }}>{simResult.riskPercentage}%</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: simCfg.color }}>{simResult.riskLevel} Risk</div>
              {baseResult && (
                <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: diff < 0 ? "rgba(46,213,115,0.1)" : diff > 0 ? "rgba(255,71,87,0.1)" : "rgba(107,140,168,0.1)", borderRadius: 20 }}>
                  {diff < 0 ? <TrendingDown size={16} color="#2ed573" /> : diff > 0 ? <TrendingUp size={16} color="#ff4757" /> : null}
                  <span style={{ fontSize: 14, fontWeight: 700, color: diff < 0 ? "#2ed573" : diff > 0 ? "#ff4757" : "#6b8ca8" }}>
                    {diff > 0 ? "+" : ""}{diff}% from baseline
                  </span>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* Sliders */}
      <div style={{ background: "#0a1628", border: "1px solid #1a2e4a", borderRadius: 20, padding: "28px" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
          <Sliders size={18} color="#00d4aa" /> Adjust Parameters
        </h3>

        {sliders.map((s) => (
          <div key={s.key} style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: "#6b8ca8", marginTop: 2 }}>{s.info}</div>
              </div>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#00d4aa", fontFamily: "'Space Mono', monospace" }}>{sim[s.key]}</span>
            </div>
            <input
              type="range" min={s.min} max={s.max} step={s.step} value={sim[s.key]}
              onChange={(e) => setSim((p) => ({ ...p, [s.key]: parseFloat(e.target.value) }))}
              style={{ width: "100%", accentColor: "#00d4aa", height: 6 }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b8ca8", marginTop: 4 }}>
              <span>{s.min}</span><span>{s.max}</span>
            </div>
          </div>
        ))}

        {/* Smoking toggle */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 10 }}>Smoking Status</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {["never", "former", "current"].map((v) => (
              <button key={v} onClick={() => setSim((p) => ({ ...p, smoking: v }))}
                style={{
                  padding: "8px 20px", borderRadius: 20,
                  border: `1px solid ${sim.smoking === v ? "#00d4aa" : "#1a2e4a"}`,
                  background: sim.smoking === v ? "rgba(0,212,170,0.1)" : "transparent",
                  color: sim.smoking === v ? "#00d4aa" : "#6b8ca8",
                  cursor: "pointer", fontWeight: 600, fontSize: 13,
                }}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => setSim({ ...base })}
          style={{ background: "transparent", border: "1px solid #1a2e4a", borderRadius: 10, padding: "10px 24px", color: "#6b8ca8", cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <RefreshCw size={14} /> Reset to Baseline
        </button>
      </div>
    </div>
  );
}
