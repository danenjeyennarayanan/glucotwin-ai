// pages/ResultsPage.jsx — Prediction results with PDF download
import { useState } from "react";
import { Plus, Download, Loader } from "lucide-react";
import RiskGauge from "../components/RiskGauge";
import { RISK_CONFIG, RECOMMENDATIONS } from "../services/constants";
import API from "../services/api";

export default function ResultsPage({ result, onNewPrediction }) {
  const cfg = RISK_CONFIG[result.riskLevel];
  const recs = RECOMMENDATIONS[result.riskLevel] || [];
  const [downloading, setDownloading] = useState(false);

  // PDF download: tries server-side report endpoint first (richer layout),
  // falls back to client-side window.print() if no recordId or server error.
  async function handleDownload() {
    if (result.recordId) {
      setDownloading(true);
      try {
        await API.downloadReport(result.recordId);
        setDownloading(false);
        return;
      } catch (err) {
        console.warn("Server report failed, falling back to client print:", err);
        setDownloading(false);
      }
    }
    // ── Client-side fallback: open a styled HTML page and let the user print to PDF ──
    const printContent = `
      <html>
        <head>
          <title>GlucoTwin AI — Health Report</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111; padding: 32px; }
            h1 { color: #00a87e; } h2 { color: #444; margin-top: 24px; }
            .badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-weight: bold;
              background: ${cfg.bg}; color: ${cfg.color}; border: 1px solid ${cfg.color}40; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
            th { background: #f4f4f4; }
            .rec { background: #f9f9f9; border-left: 3px solid #00a87e; padding: 8px 12px; margin: 6px 0; font-size: 14px; }
            footer { margin-top: 40px; font-size: 12px; color: #888; border-top: 1px solid #ddd; padding-top: 12px; }
          </style>
        </head>
        <body>
          <h1>GlucoTwin AI — Diabetes Risk Report</h1>
          <p><strong>Date:</strong> ${new Date(result.timestamp).toLocaleString()}</p>
          <p><strong>Risk Score:</strong> ${result.riskPercentage}% &nbsp;<span class="badge">${result.riskLevel} Risk</span></p>
          <p><strong>AI Assessment:</strong> ${result.prediction}</p>

          <h2>Health Parameters</h2>
          <table>
            <tr><th>Parameter</th><th>Value</th></tr>
            <tr><td>Gender</td><td>${result.input?.gender}</td></tr>
            <tr><td>Age</td><td>${result.input?.age} years</td></tr>
            <tr><td>BMI</td><td>${result.input?.bmi} kg/m²</td></tr>
            <tr><td>HbA1c Level</td><td>${result.input?.hba1c}%</td></tr>
            <tr><td>Blood Glucose</td><td>${result.input?.glucose} mg/dL</td></tr>
            <tr><td>Hypertension</td><td>${result.input?.hypertension ? "Yes" : "No"}</td></tr>
            <tr><td>Heart Disease</td><td>${result.input?.heartDisease ? "Yes" : "No"}</td></tr>
            <tr><td>Smoking History</td><td>${result.input?.smoking}</td></tr>
          </table>

          <h2>Contributing Factors (Explainable AI)</h2>
          <table>
            <tr><th>Factor</th><th>Impact</th></tr>
            ${result.factors.filter(f => f.impact > 0).map(f => `<tr><td>${f.feature}</td><td>${f.impact}%</td></tr>`).join("")}
          </table>

          <h2>Personalized Recommendations</h2>
          ${recs.map(r => `<div class="rec">${r}</div>`).join("")}

          <footer>
            ⚕️ ${result.disclaimer || "This report is AI-assisted and not a medical diagnosis. Please consult a qualified healthcare professional."}
          </footer>
        </body>
      </html>
    `;
    const win = window.open("", "_blank");
    win.document.write(printContent);
    win.document.close();
    win.print();
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>Prediction Results</h1>
          <p style={{ color: "#6b8ca8" }}>{new Date(result.timestamp).toLocaleString()}</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={handleDownload} disabled={downloading} style={{
            background: "transparent", border: "1px solid #1a2e4a", borderRadius: 12,
            padding: "12px 20px", color: "#e8f4f8",
            cursor: downloading ? "not-allowed" : "pointer",
            fontWeight: 600, opacity: downloading ? 0.7 : 1,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            {downloading
              ? <><Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> Preparing…</>
              : <><Download size={16} /> Download Report</>
            }
          </button>
          <button onClick={onNewPrediction} style={{
            background: "linear-gradient(135deg,#00d4aa,#6c63ff)", border: "none",
            borderRadius: 12, padding: "12px 24px", color: "#fff", cursor: "pointer",
            fontWeight: 700, display: "flex", alignItems: "center", gap: 8,
          }}>
            <Plus size={16} /> New Assessment
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ background: "rgba(255,165,2,0.07)", border: "1px solid rgba(255,165,2,0.25)", borderRadius: 12, padding: "12px 18px", color: "#ffa502", fontSize: 12, marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 10, lineHeight: 1.6 }}>
        <span style={{ fontSize: 16 }}>⚕️</span>
        <span>{result.disclaimer || "This prediction is AI-assisted and not a medical diagnosis. Please consult a qualified healthcare professional."}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, marginBottom: 24 }}>
        {/* Gauge */}
        <div style={{ background: "#0a1628", border: `1px solid ${cfg.color}30`, borderRadius: 20, padding: "36px 48px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <RiskGauge percentage={result.riskPercentage} riskLevel={result.riskLevel} />
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: cfg.color }}>{result.prediction}</div>
            <div style={{ fontSize: 13, color: "#6b8ca8", marginTop: 4 }}>AI Assessment</div>
          </div>
        </div>

        {/* Factors */}
        <div style={{ background: "#0a1628", border: "1px solid #1a2e4a", borderRadius: 20, padding: "24px" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>🔬 Explainable AI — Factor Contributions</h3>
          {result.factors.filter((f) => f.impact > 0).map((f, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{f.feature}</span>
                <span style={{ fontSize: 13, color: "#00d4aa", fontFamily: "'Space Mono', monospace" }}>
                  {f.impact}% <span style={{ color: "#6b8ca8", fontFamily: "sans-serif" }}>({f.direction} risk)</span>
                </span>
              </div>
              <div style={{ height: 8, background: "#1a2e4a", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${f.impact}%`, background: "linear-gradient(90deg,#00d4aa,#6c63ff)", borderRadius: 4, transition: "width 1s ease" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div style={{ background: "#0a1628", border: `1px solid ${cfg.color}30`, borderRadius: 20, padding: "28px" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>💊 Personalized Prevention Plan</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 12 }}>
          {recs.map((rec, i) => (
            <div key={i} style={{ background: "#0f1f3d", borderRadius: 12, padding: "14px 16px", fontSize: 13, lineHeight: 1.5, border: "1px solid #1a2e4a" }}>
              {rec}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
