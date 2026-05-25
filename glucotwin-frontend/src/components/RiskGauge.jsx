// components/RiskGauge.jsx — Animated circular risk gauge
import { useState, useEffect } from "react";
import { RISK_CONFIG } from "../services/constants";

export default function RiskGauge({ percentage, riskLevel }) {
  const [animPct, setAnimPct] = useState(0);
  const cfg = RISK_CONFIG[riskLevel] || RISK_CONFIG.Low;

  useEffect(() => {
    const timer = setTimeout(() => {
      let cur = 0;
      const step = setInterval(() => {
        cur += 2;
        if (cur >= percentage) {
          setAnimPct(percentage);
          clearInterval(step);
        } else {
          setAnimPct(cur);
        }
      }, 16);
    }, 300);
    return () => clearTimeout(timer);
  }, [percentage]);

  const radius = 80;
  const stroke = 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animPct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: 200, height: 200 }}>
        <svg width="200" height="200" style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx="100" cy="100" r={radius}
            fill="none" stroke="#1a2e4a" strokeWidth={stroke}
          />
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={cfg.color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 0.05s",
              filter: `drop-shadow(0 0 8px ${cfg.color})`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{
            fontSize: 42, fontWeight: 800, color: cfg.color,
            fontFamily: "'Space Mono', monospace",
          }}>
            {animPct}%
          </span>
          <span style={{
            fontSize: 12, color: "#6b8ca8",
            letterSpacing: 2, textTransform: "uppercase",
          }}>
            Risk Score
          </span>
        </div>
      </div>
      <div style={{
        background: cfg.bg,
        border: `1px solid ${cfg.color}40`,
        borderRadius: 20,
        padding: "6px 20px",
        color: cfg.color,
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: 1,
        boxShadow: `0 0 12px ${cfg.color}30`,
      }}>
        {cfg.label}
      </div>
    </div>
  );
}
