// services/constants.js — Shared constants and helper functions

export const COLORS = {
  primary: "#00d4aa",
  primaryDark: "#00a87e",
  secondary: "#6c63ff",
  danger: "#ff4757",
  warning: "#ffa502",
  success: "#2ed573",
  bg: "#050d1a",
  bgCard: "#0a1628",
  bgCardHover: "#0f1f3d",
  border: "#1a2e4a",
  text: "#e8f4f8",
  textMuted: "#6b8ca8",
};

export const RISK_CONFIG = {
  Low: {
    color: "#2ed573",
    bg: "rgba(46,213,115,0.1)",
    label: "Low Risk",
    icon: "✓",
    range: "0–30%",
  },
  Medium: {
    color: "#ffa502",
    bg: "rgba(255,165,2,0.1)",
    label: "Medium Risk",
    icon: "⚠",
    range: "31–60%",
  },
  High: {
    color: "#ff4757",
    bg: "rgba(255,71,87,0.1)",
    label: "High Risk",
    icon: "!",
    range: "61–100%",
  },
};

export const RECOMMENDATIONS = {
  Low: [
    "✅ Maintain your current healthy lifestyle — you're doing great!",
    "🥗 Continue a balanced diet rich in whole grains, vegetables, and lean proteins.",
    "🏃 Keep up regular physical activity — aim for 150 min/week.",
    "🩺 Schedule annual health check-ups to monitor glucose levels.",
    "💧 Stay well-hydrated — drink 8–10 glasses of water daily.",
  ],
  Medium: [
    "⚠️ Your risk is moderate — take proactive steps now to prevent progression.",
    "🍬 Reduce sugar and refined carbohydrate intake significantly.",
    "📊 Monitor your blood glucose levels at least once a month.",
    "⚖️ Work toward achieving a healthy BMI through diet and exercise.",
    "🚭 If you smoke, consider a cessation program immediately.",
    "🧘 Manage stress through mindfulness, yoga, or meditation.",
  ],
  High: [
    "🚨 High risk detected — please consult a healthcare professional urgently.",
    "👨‍⚕️ Schedule an appointment with an endocrinologist or diabetologist.",
    "🥦 Follow a strict low-glycemic diet — eliminate processed foods.",
    "💉 Consider regular HbA1c and fasting glucose testing every 3 months.",
    "🏋️ Begin a supervised daily exercise program (30 min/day minimum).",
    "💊 Discuss preventive medication options with your doctor.",
    "📱 Use a continuous glucose monitor (CGM) for real-time tracking.",
  ],
};
