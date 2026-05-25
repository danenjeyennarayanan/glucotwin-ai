// pages/AuthPage.jsx — Login / Signup / Forgot Password
import { useState } from "react";
import { Activity, Eye, EyeOff } from "lucide-react";
import API, { ApiError } from "../services/api";

export default function AuthPage({ mode, onNavigate, onLogin }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  // Forgot password mode
  if (mode === "forgot") {
    return (
      <AuthShell>
        <h2 style={{ fontSize: 26, fontWeight: 800, textAlign: "center", marginBottom: 8 }}>Reset Password</h2>
        <p style={{ color: "#6b8ca8", fontSize: 14, textAlign: "center", marginBottom: 28 }}>
          Enter your email and we'll send you a reset link.
        </p>
        {forgotSent ? (
          <div style={{ background: "rgba(46,213,115,0.1)", border: "1px solid rgba(46,213,115,0.3)", borderRadius: 10, padding: "16px", color: "#2ed573", textAlign: "center", fontSize: 14 }}>
            ✅ If that email is registered, a reset link has been sent.
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, color: "#6b8ca8", marginBottom: 8, fontWeight: 600 }}>Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>
            <button
              onClick={async () => {
                try { await API.forgotPassword(form.email); } catch {}
                setForgotSent(true);
              }}
              style={btnStyle}
            >
              Send Reset Link
            </button>
          </>
        )}
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#6b8ca8" }}>
          <button onClick={() => onNavigate("login")} style={linkBtn}>← Back to Login</button>
        </div>
      </AuthShell>
    );
  }

  async function handleSubmit() {
    setError("");
    if (mode === "signup" && !form.name.trim()) { setError("Name is required."); return; }
    if (!form.email || !form.password) { setError("All fields required."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      const resp =
        mode === "login"
          ? await API.login({ email: form.email, password: form.password })
          : await API.register({ name: form.name, email: form.email, password: form.password });
      onLogin(resp);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Connection error. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      {error && (
        <div style={{
          background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)",
          borderRadius: 10, padding: "12px 16px", color: "#ff4757",
          marginBottom: 20, fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {mode === "signup" && (
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Full Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Jane Doe"
            style={inputStyle}
          />
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Email Address</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="you@example.com"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 28 }}>
        <label style={labelStyle}>Password</label>
        <div style={{ position: "relative" }}>
          <input
            type={showPw ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="••••••••"
            style={{ ...inputStyle, paddingRight: 48 }}
          />
          <button
            onClick={() => setShowPw(!showPw)}
            style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#6b8ca8", cursor: "pointer" }}
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {mode === "login" && (
          <div style={{ textAlign: "right", marginTop: 8 }}>
            <button onClick={() => onNavigate("forgot")} style={linkBtn}>Forgot password?</button>
          </div>
        )}
      </div>

      <button onClick={handleSubmit} disabled={loading} style={{
        ...btnStyle,
        background: loading ? "#1a2e4a" : "linear-gradient(135deg,#00d4aa,#6c63ff)",
        cursor: loading ? "default" : "pointer",
      }}>
        {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
      </button>

      <div style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#6b8ca8" }}>
        {mode === "login" ? (
          <>Don't have an account? <button onClick={() => onNavigate("signup")} style={linkBtn}>Sign Up</button></>
        ) : (
          <>Already have an account? <button onClick={() => onNavigate("login")} style={linkBtn}>Login</button></>
        )}
      </div>
    </AuthShell>
  );
}

// ── Shared sub-components ───────────────────────────────────────────────────
function AuthShell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#050d1a", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ position: "absolute", top: "30%", left: "30%", width: 600, height: 600, background: "radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, background: "linear-gradient(135deg,#00d4aa,#6c63ff)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Activity size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#e8f4f8" }}>GlucoTwin AI</h1>
        </div>
        <div style={{ background: "#0a1628", border: "1px solid #1a2e4a", borderRadius: 24, padding: "40px 36px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", background: "#0f1f3d", border: "1px solid #1a2e4a",
  borderRadius: 12, padding: "12px 16px", color: "#e8f4f8",
  fontSize: 14, outline: "none", boxSizing: "border-box",
};

const labelStyle = {
  display: "block", fontSize: 13, color: "#6b8ca8",
  marginBottom: 8, fontWeight: 600,
};

const btnStyle = {
  width: "100%", background: "linear-gradient(135deg,#00d4aa,#6c63ff)",
  border: "none", borderRadius: 12, padding: "14px", color: "#fff",
  fontSize: 16, fontWeight: 700, cursor: "pointer",
};

const linkBtn = {
  background: "none", border: "none", color: "#00d4aa",
  cursor: "pointer", fontWeight: 600, fontSize: 14,
};
