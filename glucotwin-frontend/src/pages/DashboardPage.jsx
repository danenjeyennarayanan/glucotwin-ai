// pages/DashboardPage.jsx — Health dashboard with charts
import { Activity, Droplets, User, Heart, FileText, Brain } from "lucide-react";
import { RISK_CONFIG } from "../services/constants";
import { RiskTrendChart, GlucoseTrendChart, RiskDistributionPieChart } from "../charts/RiskCharts";

export default function DashboardPage({ user, history }) {
  const latest = history[history.length - 1];

  const chartData = history.map((h, i) => ({
    name: `#${i + 1}`,
    risk: h.riskPercentage,
    glucose: h.input?.glucose || 0,
    bmi: h.input?.bmi || 0,
    hba1c: h.input?.hba1c || 0,
  }));

  const riskDist = [
    { name: "Low Risk",    value: history.filter((h) => h.riskLevel === "Low").length,    color: "#2ed573" },
    { name: "Medium Risk", value: history.filter((h) => h.riskLevel === "Medium").length, color: "#ffa502" },
    { name: "High Risk",   value: history.filter((h) => h.riskLevel === "High").length,   color: "#ff4757" },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>Health Dashboard</h1>
        <p style={{ color: "#6b8ca8" }}>Welcome back, {user.name}! Here's your health overview.</p>
      </div>

      {!latest ? (
        <div style={{ background: "#0a1628", border: "1px solid #1a2e4a", borderRadius: 20, padding: "60px", textAlign: "center" }}>
          <Brain size={48} color="#6b8ca8" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No Health Records Yet</h3>
          <p style={{ color: "#6b8ca8" }}>Run your first AI health assessment to see your dashboard.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Current Risk",   value: latest.riskPercentage + "%",      color: RISK_CONFIG[latest.riskLevel]?.color, icon: <Activity size={20} /> },
              { label: "Blood Glucose",  value: latest.input?.glucose + " mg/dL", color: "#6c63ff",                            icon: <Droplets size={20} /> },
              { label: "BMI",            value: latest.input?.bmi,                color: "#ffa502",                            icon: <User size={20} /> },
              { label: "HbA1c",          value: latest.input?.hba1c + "%",        color: "#2ed573",                            icon: <Heart size={20} /> },
              { label: "Total Records",  value: history.length,                   color: "#00d4aa",                            icon: <FileText size={20} /> },
            ].map((card, i) => (
              <div key={i} style={{ background: "#0a1628", border: "1px solid #1a2e4a", borderRadius: 16, padding: "20px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: "#6b8ca8", fontWeight: 600 }}>{card.label}</div>
                  <div style={{ color: card.color }}>{card.icon}</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: card.color, fontFamily: "'Space Mono', monospace" }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div style={{ background: "#0a1628", border: "1px solid #1a2e4a", borderRadius: 20, padding: "24px" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>📈 Risk Trend</h3>
              <RiskTrendChart data={chartData} />
            </div>
            <div style={{ background: "#0a1628", border: "1px solid #1a2e4a", borderRadius: 20, padding: "24px" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>🩸 Glucose Trend</h3>
              <GlucoseTrendChart data={chartData} />
            </div>
          </div>

          {/* Risk Distribution */}
          {riskDist.length > 0 && (
            <div style={{ background: "#0a1628", border: "1px solid #1a2e4a", borderRadius: 20, padding: "24px", display: "flex", gap: 40, alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Risk Distribution</h3>
                <p style={{ color: "#6b8ca8", fontSize: 13 }}>Across all your assessments</p>
              </div>
              <RiskDistributionPieChart data={riskDist} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {riskDist.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color }} />
                    <span style={{ color: "#6b8ca8" }}>{d.name}:</span>
                    <span style={{ fontWeight: 700, color: d.color }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
