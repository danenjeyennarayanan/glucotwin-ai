// pages/HistoryPage.jsx — Health history table
import { Clock } from "lucide-react";
import { RISK_CONFIG } from "../services/constants";

export default function HistoryPage({ history }) {
  if (!history.length) {
    return (
      <div>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Health History</h1>
        <div style={{ background: "#0a1628", border: "1px solid #1a2e4a", borderRadius: 20, padding: 60, textAlign: "center", marginTop: 24 }}>
          <Clock size={48} color="#6b8ca8" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "#6b8ca8" }}>No assessments yet. Run your first prediction to build your health timeline.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 28 }}>Health History</h1>
      <div style={{ background: "#0a1628", border: "1px solid #1a2e4a", borderRadius: 20, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1a2e4a" }}>
              {["#", "Date", "Risk %", "Level", "Glucose", "BMI", "HbA1c", "Prediction"].map((h) => (
                <th key={h} style={{ padding: "16px 20px", textAlign: "left", fontSize: 12, color: "#6b8ca8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...history].reverse().map((h, i) => {
              const cfg = RISK_CONFIG[h.riskLevel];
              return (
                <tr key={i} style={{ borderBottom: "1px solid #0f1f3d" }}>
                  <td style={{ padding: "16px 20px", color: "#6b8ca8", fontSize: 13 }}>{history.length - i}</td>
                  <td style={{ padding: "16px 20px", fontSize: 13 }}>{new Date(h.timestamp).toLocaleDateString()}</td>
                  <td style={{ padding: "16px 20px", fontWeight: 800, color: cfg?.color, fontFamily: "'Space Mono', monospace" }}>{h.riskPercentage}%</td>
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ background: cfg?.bg, color: cfg?.color, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
                      {h.riskLevel}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px", fontSize: 13 }}>{h.input?.glucose} mg/dL</td>
                  <td style={{ padding: "16px 20px", fontSize: 13 }}>{h.input?.bmi}</td>
                  <td style={{ padding: "16px 20px", fontSize: 13 }}>{h.input?.hba1c}%</td>
                  <td style={{ padding: "16px 20px", fontSize: 13, color: h.prediction === "Diabetic" ? "#ff4757" : "#2ed573", fontWeight: 700 }}>
                    {h.prediction}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
