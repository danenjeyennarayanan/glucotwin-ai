/**
 * GlucoTwinAI.jsx — Root App Router
 *
 * All page components, services, hooks, context, and charts are now
 * split into their proper folders per the project spec:
 *
 *  src/
 *  ├── pages/        LandingPage, AuthPage, PredictPage, ResultsPage,
 *  │                 DashboardPage, DigitalTwinPage, HistoryPage, AdminPage
 *  ├── components/   AppLayout, RiskGauge, ChatBot
 *  ├── charts/       RiskCharts (RiskTrendChart, GlucoseTrendChart, etc.)
 *  ├── services/     api.js, constants.js
 *  ├── hooks/        usePrediction.js
 *  └── context/      AuthContext.js, ThemeContext.js
 */

import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";

// Context
import { useAuth } from "./context/AuthContext";

// Layout & shared components
import AppLayout from "./components/AppLayout";
import ChatBot   from "./components/ChatBot";

// Pages
import LandingPage     from "./pages/LandingPage";
import AuthPage        from "./pages/AuthPage";
import DashboardPage   from "./pages/DashboardPage";
import PredictPage     from "./pages/PredictPage";
import ResultsPage     from "./pages/ResultsPage";
import DigitalTwinPage from "./pages/DigitalTwinPage";
import HistoryPage     from "./pages/HistoryPage";
import AdminPage       from "./pages/AdminPage";
import ProfilePage     from "./pages/ProfilePage";

export default function GlucoTwinApp() {
  const { user, history, latestResult, login, logout, addResult } = useAuth();

  const [page, setPage]         = useState("landing");
  const [showResult, setShowResult] = useState(false);
  const [showChat, setShowChat]  = useState(false);

  // If user is already logged in (session restored by AuthContext), go to dashboard
  useEffect(() => {
    if (user && page === "landing") setPage("dashboard");
  }, [user]);

  // Session-expired → back to login
  useEffect(() => {
    const onExpired = () => { setPage("login"); setShowResult(false); };
    window.addEventListener("gt:expired", onExpired);
    return () => window.removeEventListener("gt:expired", onExpired);
  }, []);

  function handleLogin(resp) {
    login(resp);
    setPage("dashboard");
  }

  function handleLogout() {
    logout();
    setPage("landing");
    setShowResult(false);
  }

  function handleResult(result) {
    addResult(result);
    setShowResult(true);
    setPage("result");
  }

  function handleNavigate(p) {
    setPage(p);
    if (p === "predict") setShowResult(false);
  }

  const APP_PAGES = ["dashboard", "predict", "result", "twin", "history", "admin", "profile"];
  const isApp = APP_PAGES.includes(page) && !!user;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        @keyframes spin   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      `}</style>

      {/* Public pages */}
      {!isApp && (
        <>
          {page === "landing" && <LandingPage onNavigate={setPage} />}
          {page === "login"   && <AuthPage mode="login"  onNavigate={setPage} onLogin={handleLogin} />}
          {page === "signup"  && <AuthPage mode="signup" onNavigate={setPage} onLogin={handleLogin} />}
          {page === "forgot"  && <AuthPage mode="forgot" onNavigate={setPage} onLogin={handleLogin} />}
        </>
      )}

      {/* Authenticated app shell */}
      {isApp && (
        <AppLayout
          user={user}
          onLogout={handleLogout}
          activePage={page === "result" ? "predict" : page}
          onNavigate={handleNavigate}
        >
          {page === "dashboard" && <DashboardPage user={user} history={history} />}
          {page === "predict"   && !showResult && <PredictPage onResult={handleResult} user={user} />}
          {page === "result"    && showResult && latestResult && (
            <ResultsPage
              result={latestResult}
              onNewPrediction={() => { setShowResult(false); setPage("predict"); }}
            />
          )}
          {page === "twin"    && <DigitalTwinPage latestResult={latestResult} />}
          {page === "history" && <HistoryPage history={history} />}
          {page === "admin"   && user.role === "ADMIN" && <AdminPage history={history} />}
          {page === "profile" && <ProfilePage />}
        </AppLayout>
      )}

      {/* Floating GlucoBot chat button — only shown when logged in */}
      {isApp && (
        <>
          <button
            onClick={() => setShowChat((s) => !s)}
            style={{
              position: "fixed", bottom: 24, right: 24,
              width: 56, height: 56,
              background: "linear-gradient(135deg,#00d4aa,#6c63ff)",
              border: "none", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", boxShadow: "0 4px 20px rgba(0,212,170,0.4)", zIndex: 999,
            }}
          >
            {showChat ? <X size={22} color="#fff" /> : <MessageCircle size={22} color="#fff" />}
          </button>
          {showChat && <ChatBot onClose={() => setShowChat(false)} />}
        </>
      )}
    </div>
  );
}
