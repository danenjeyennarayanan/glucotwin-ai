// pages/AdminPage.jsx — Admin analytics dashboard
import { useState, useEffect } from "react";
import { Users, Brain, AlertTriangle, BarChart2 } from "lucide-react";
import API from "../services/api";
import { AdminPieChart } from "../charts/RiskCharts";

export default function AdminPage({ history }) {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    Promise.all([API.adminStats(), API.adminUsers()])
      .then(([s]) => setStats(s))
      .catch((err) => setError(err.message || "Failed to load admin data"))
      .finally(() => setLoading(false));
  }, []);

  const totalPredictions = stats?.totalPredictions ?? history.length;
  const highRisk   = stats?.highRisk   ?? history.filter((h) => h.riskLevel === "High").length;
  const medRisk    = stats?.mediumRisk ?? history.filter((h) => h.riskLevel === "Medium").length;
  const lowRisk    = stats?.lowRisk    ?? history.filter((h) => h.riskLevel === "Low").length;
  const totalUsers = stats?.totalUsers ?? 1;
  const avgRisk    = history.length
    ? Math.round(history.reduce((s, h) => s + (h.riskPercentage || 0), 0) / history.length)
    : 0;

  const pieData = [
    { name: "Low Risk",    value: lowRisk  || 1, color: "#2ed573" },
    { name: "Medium Risk", value: medRisk  || 1, color: "#ffa502" },
    { name: "High Risk",   value: highRisk || 1, color: "#ff4757" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Admin Panel</h1>
      <p style={{ color: "#6b8ca8", marginBottom: 32 }}>Platform analytics and health intelligence overview.</p>

      {error && (
        <div style={{ background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)", borderRadius: 10, padding: "12px 16px", color: "#ff4757", marginBottom: 20, fontSize: 13 }}>
          {error}
        </div>
      )}
      {loading && <div style={{ color: "#6b8ca8", marginBottom: 20, fontSize: 13 }}>Loading platform stats…</div>}

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Users",       value: loading ? "…" : totalUsers,            icon: <Users size={20} />,         color: "#6c63ff" },
          { label: "Total Predictions", value: loading ? "…" : totalPredictions,       icon: <Brain size={20} />,         color: "#00d4aa" },
          { label: "High Risk Cases",   value: loading ? "…" : highRisk,               icon: <AlertTriangle size={20} />, color: "#ff4757" },
          { label: "Avg Risk Score",    value: loading ? "…" : avgRisk + "%",          icon: <BarChart2 size={20} />,     color: "#ffa502" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#0a1628", border: "1px solid #1a2e4a", borderRadius: 16, padding: "20px 24px" }}>
            <div style={{ color: s.color, marginBottom: 12 }}>{s.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: s.color, fontFamily: "'Space Mono', monospace" }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "#6b8ca8", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pie chart */}
      <div style={{ background: "#0a1628", border: "1px solid #1a2e4a", borderRadius: 20, padding: "28px" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Risk Distribution Analytics</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <AdminPieChart data={pieData} />
          <div style={{ flex: 1 }}>
            {pieData.map((d, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color }} />
                    {d.name}
                  </span>
                  <span style={{ fontWeight: 700, color: d.color }}>{d.value}</span>
                </div>
                <div style={{ height: 6, background: "#1a2e4a", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: totalPredictions ? `${(d.value / totalPredictions) * 100}%` : "33%", background: d.color, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
