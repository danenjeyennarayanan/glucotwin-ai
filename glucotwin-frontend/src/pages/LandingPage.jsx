// pages/LandingPage.jsx — Hero landing page with Framer Motion animations
import { motion } from "framer-motion";
import {
  Activity, Brain, Layers, Zap, Shield, MessageCircle,
  Cpu, ArrowRight,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: "easeOut" },
  }),
};

export default function LandingPage({ onNavigate }) {
  const stats = [
    { value: "537M+", label: "People with diabetes worldwide" },
    { value: "90%",   label: "Type 2 cases are preventable" },
    { value: "98.2%", label: "ML model accuracy" },
    { value: "< 2s",  label: "Prediction time" },
  ];

  const features = [
    { icon: <Brain size={28} />,         title: "AI Prediction",     desc: "Random Forest ML model trained on 100K+ health records delivers precise diabetes risk assessments.",       color: "#6c63ff" },
    { icon: <Layers size={28} />,        title: "Digital Twin",      desc: "Create your virtual health profile and simulate lifestyle changes to see their impact in real-time.",       color: "#00d4aa" },
    { icon: <Zap size={28} />,           title: "Explainable AI",    desc: "SHAP-powered factor analysis shows exactly which biomarkers are driving your risk score.",                 color: "#ffa502" },
    { icon: <Shield size={28} />,        title: "Prevention Plans",  desc: "Personalized AI-generated recommendations tailored to your unique health profile.",                        color: "#ff4757" },
    { icon: <Activity size={28} />,      title: "Health Analytics",  desc: "Track your health journey with rich dashboards, trend charts, and historical comparisons.",               color: "#2ed573" },
    { icon: <MessageCircle size={28} />, title: "AI Health Coach",   desc: "24/7 conversational AI assistant for diabetes awareness, diet tips, and lifestyle guidance.",             color: "#00d4aa" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#050d1a", color: "#e8f4f8", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Nav */}
      <nav style={{
        padding: "20px 60px", display: "flex", justifyContent: "space-between",
        alignItems: "center", borderBottom: "1px solid #0a1628",
        backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 100,
        background: "rgba(5,13,26,0.9)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40,
            background: "linear-gradient(135deg,#00d4aa,#6c63ff)",
            borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Activity size={22} color="#fff" />
          </div>
          <span style={{
            fontSize: 22, fontWeight: 800,
            background: "linear-gradient(135deg,#00d4aa,#6c63ff)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            GlucoTwin AI
          </span>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <button onClick={() => onNavigate("login")} style={{
            background: "transparent", border: "1px solid #1a2e4a",
            borderRadius: 10, padding: "10px 24px", color: "#e8f4f8",
            cursor: "pointer", fontWeight: 600,
          }}>
            Login
          </button>
          <button onClick={() => onNavigate("signup")} style={{
            background: "linear-gradient(135deg,#00d4aa,#6c63ff)",
            border: "none", borderRadius: 10, padding: "10px 24px",
            color: "#fff", cursor: "pointer", fontWeight: 700,
          }}>
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "100px 60px 80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)", width: 800, height: 800,
          background: "radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={0}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.3)",
            borderRadius: 20, padding: "6px 16px", marginBottom: 28,
            fontSize: 13, color: "#00d4aa",
          }}
        >
          <Cpu size={14} /> Powered by AI &amp; Digital Twin Technology
        </motion.div>

        <motion.h1
          variants={fadeUp} initial="hidden" animate="visible" custom={1}
          style={{ fontSize: "clamp(40px,6vw,76px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: -2 }}
        >
          Predict. Prevent.<br />
          <span style={{
            background: "linear-gradient(135deg,#00d4aa,#6c63ff)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Protect Your Health.
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp} initial="hidden" animate="visible" custom={2}
          style={{ fontSize: 20, color: "#6b8ca8", maxWidth: 620, margin: "0 auto 48px", lineHeight: 1.7 }}
        >
          GlucoTwin AI uses advanced machine learning and explainable AI to assess your diabetes risk
          and create your personalized digital health twin.
        </motion.p>

        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={3}
          style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}
        >
          <button onClick={() => onNavigate("signup")} style={{
            background: "linear-gradient(135deg,#00d4aa,#6c63ff)", border: "none",
            borderRadius: 14, padding: "16px 40px", color: "#fff", fontSize: 18,
            fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center",
            gap: 10, boxShadow: "0 0 40px rgba(0,212,170,0.3)",
          }}>
            Start Free Assessment <ArrowRight size={20} />
          </button>
          <button onClick={() => onNavigate("login")} style={{
            background: "transparent", border: "1px solid #1a2e4a",
            borderRadius: 14, padding: "16px 40px", color: "#e8f4f8",
            fontSize: 18, fontWeight: 600, cursor: "pointer",
          }}>
            View Demo
          </button>
        </motion.div>
      </section>

      {/* Stats */}
      <section style={{ padding: "40px 60px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 20, maxWidth: 1100, margin: "0 auto" }}>
        {stats.map((s, i) => (
          <motion.div
            key={i}
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
            style={{ background: "#0a1628", border: "1px solid #1a2e4a", borderRadius: 16, padding: "28px 24px", textAlign: "center" }}
          >
            <div style={{ fontSize: 40, fontWeight: 900, color: "#00d4aa", fontFamily: "'Space Mono', monospace" }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "#6b8ca8", marginTop: 6 }}>{s.label}</div>
          </motion.div>
        ))}
      </section>

      {/* Features */}
      <section style={{ padding: "80px 60px", maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ fontSize: 42, fontWeight: 800, textAlign: "center", marginBottom: 60 }}>
          Everything You Need for <span style={{ color: "#00d4aa" }}>Health Intelligence</span>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 24 }}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i % 3}
              style={{ background: "#0a1628", border: "1px solid #1a2e4a", borderRadius: 20, padding: "32px", cursor: "default" }}
              whileHover={{ y: -4, borderColor: f.color + "60" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div style={{ width: 56, height: 56, background: f.color + "20", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", color: f.color, marginBottom: 20 }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
              <p style={{ color: "#6b8ca8", lineHeight: 1.6, fontSize: 14 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 60px", textAlign: "center" }}>
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ background: "linear-gradient(135deg,rgba(0,212,170,0.1),rgba(108,99,255,0.1))", border: "1px solid #1a2e4a", borderRadius: 28, padding: "60px 40px", maxWidth: 700, margin: "0 auto" }}
        >
          <h2 style={{ fontSize: 38, fontWeight: 800, marginBottom: 20 }}>Ready to Know Your Risk?</h2>
          <p style={{ color: "#6b8ca8", marginBottom: 36, fontSize: 16 }}>Join thousands using GlucoTwin AI for proactive diabetes prevention.</p>
          <button onClick={() => onNavigate("signup")} style={{
            background: "linear-gradient(135deg,#00d4aa,#6c63ff)", border: "none",
            borderRadius: 14, padding: "16px 48px", color: "#fff", fontSize: 18,
            fontWeight: 700, cursor: "pointer",
          }}>
            Start Your Health Journey →
          </button>
        </motion.div>
      </section>
    </div>
  );
}
