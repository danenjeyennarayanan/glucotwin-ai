// pages/ProfilePage.jsx — User profile management for GlucoTwin AI
import { useState } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Shield, Calendar, Activity,
  CheckCircle, AlertCircle, Edit3, Save, X,
  TrendingUp, Award, Clock
} from "lucide-react";
import API, { stor } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { RISK_CONFIG } from "../services/constants";

export default function ProfilePage() {
  const { user, history, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [saveMsg, setSaveMsg] = useState(null);

  // Derive stats from prediction history
  const totalPredictions = history.length;
  const lastResult = history[history.length - 1] || null;
  const avgRisk =
    totalPredictions > 0
      ? Math.round(history.reduce((s, h) => s + (h.riskPercentage || 0), 0) / totalPredictions)
      : null;

  const riskCounts = history.reduce((acc, h) => {
    acc[h.riskLevel] = (acc[h.riskLevel] || 0) + 1;
    return acc;
  }, {});

  async function handleSave() {
    try {
      await API.updateProfile({ name: displayName });
      // Update both React state and sessionStorage atomically via context
      updateUser({ name: displayName });
      setSaveMsg({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setSaveMsg({ type: "error", text: err.message || "Update failed. Please try again." });
    }
    setEditing(false);
    setTimeout(() => setSaveMsg(null), 4000);
  }

  const joinDate = new Date().toLocaleDateString("en-IN", {
    year: "numeric", month: "long"
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="text-emerald-400" size={26} />
            My Profile
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your account and view your health summary
          </p>
        </motion.div>

        {/* Save feedback */}
        {saveMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 p-3 rounded-lg mb-4 text-sm font-medium ${
              saveMsg.type === "success"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-red-500/20 text-red-300 border border-red-500/30"
            }`}
          >
            {saveMsg.type === "success"
              ? <CheckCircle size={16} />
              : <AlertCircle size={16} />}
            {saveMsg.text}
          </motion.div>
        )}

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 mb-5"
        >
          {/* Avatar + name */}
          <div className="flex items-start gap-5 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500
                            flex items-center justify-center text-2xl font-bold text-white shadow-lg shrink-0">
              {(displayName || user?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5
                               text-white text-lg font-semibold focus:outline-none
                               focus:ring-2 focus:ring-emerald-500 w-full max-w-xs"
                    placeholder="Display name"
                  />
                  <button
                    onClick={handleSave}
                    className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg
                               transition-colors"
                    title="Save"
                  >
                    <Save size={16} />
                  </button>
                  <button
                    onClick={() => { setEditing(false); setDisplayName(user?.name || ""); }}
                    className="p-1.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-lg
                               transition-colors"
                    title="Cancel"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white truncate">
                    {displayName || user?.name}
                  </h2>
                  <button
                    onClick={() => setEditing(true)}
                    className="p-1 text-slate-400 hover:text-emerald-400 transition-colors"
                    title="Edit name"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
              )}
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1
                ${user?.role === "ADMIN"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"}`}>
                <Shield size={10} />
                {user?.role === "ADMIN" ? "Administrator" : "User"}
              </span>
            </div>
          </div>

          {/* Info fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoField icon={<Mail size={15} />} label="Email" value={user?.email} />
            <InfoField icon={<Shield size={15} />} label="Role" value={user?.role} />
            <InfoField icon={<Calendar size={15} />} label="Member since" value={joinDate} />
            <InfoField icon={<Activity size={15} />} label="User ID"
                       value={`#${user?.userId}`} mono />
          </div>
        </motion.div>

        {/* Health summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 mb-5"
        >
          <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
            <TrendingUp size={17} className="text-cyan-400" />
            Health Summary
          </h3>

          {totalPredictions === 0 ? (
            <p className="text-slate-400 text-sm">
              No predictions yet. Submit your first health assessment to see your summary here.
            </p>
          ) : (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <StatCard
                  icon={<Activity size={18} />}
                  label="Total Tests"
                  value={totalPredictions}
                  color="text-cyan-400"
                />
                <StatCard
                  icon={<TrendingUp size={18} />}
                  label="Avg Risk"
                  value={`${avgRisk}%`}
                  color={
                    avgRisk > 60 ? "text-red-400" :
                    avgRisk > 30 ? "text-yellow-400" : "text-emerald-400"
                  }
                />
                <StatCard
                  icon={<Clock size={18} />}
                  label="Latest Risk"
                  value={lastResult ? `${lastResult.riskPercentage}%` : "—"}
                  color={
                    lastResult?.riskLevel === "High" ? "text-red-400" :
                    lastResult?.riskLevel === "Medium" ? "text-yellow-400" : "text-emerald-400"
                  }
                />
              </div>

              {/* Risk distribution */}
              <div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-2">
                  Risk Distribution
                </p>
                <div className="space-y-2">
                  {["Low", "Medium", "High"].map(level => {
                    const cfg = RISK_CONFIG[level];
                    const count = riskCounts[level] || 0;
                    const pct = totalPredictions > 0
                      ? Math.round((count / totalPredictions) * 100) : 0;
                    return (
                      <div key={level}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium" style={{ color: cfg.color }}>
                            {level} Risk
                          </span>
                          <span className="text-slate-400">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: cfg.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Latest result badge */}
              {lastResult && (
                <div className="mt-4 p-3 rounded-xl border bg-white/5"
                     style={{ borderColor: RISK_CONFIG[lastResult.riskLevel]?.color + "40" }}>
                  <p className="text-xs text-slate-400 mb-1">Latest Assessment</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">
                      {lastResult.riskPercentage}% Diabetes Risk
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            color: RISK_CONFIG[lastResult.riskLevel]?.color,
                            background: RISK_CONFIG[lastResult.riskLevel]?.bg
                          }}>
                      {lastResult.riskLevel} Risk
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Achievement badges */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
            <Award size={17} className="text-yellow-400" />
            Achievements
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Badge
              earned={totalPredictions >= 1}
              icon="🩺"
              label="First Test"
              desc="Completed first prediction"
            />
            <Badge
              earned={totalPredictions >= 5}
              icon="📊"
              label="Health Tracker"
              desc="5 predictions completed"
            />
            <Badge
              earned={totalPredictions >= 10}
              icon="🏆"
              label="Dedicated"
              desc="10 predictions completed"
            />
            <Badge
              earned={lastResult?.riskLevel === "Low"}
              icon="💚"
              label="Low Risk"
              desc="Latest result is Low Risk"
            />
            <Badge
              earned={user?.role === "ADMIN"}
              icon="🔑"
              label="Admin"
              desc="Platform administrator"
            />
            <Badge
              earned={totalPredictions > 0 && !history.some(h => h.riskLevel === "High")}
              icon="⭐"
              label="Stay Safe"
              desc="No High Risk results yet"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoField({ icon, label, value, mono }) {
  return (
    <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
      <span className="text-emerald-400 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className={`text-sm text-white font-medium truncate ${mono ? "font-mono" : ""}`}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
      <span className={`${color} flex justify-center mb-1`}>{icon}</span>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

function Badge({ earned, icon, label, desc }) {
  return (
    <div className={`rounded-xl p-3 border text-center transition-all ${
      earned
        ? "bg-yellow-500/10 border-yellow-500/30"
        : "bg-white/3 border-white/5 opacity-40"
    }`}>
      <div className="text-2xl mb-1">{icon}</div>
      <p className={`text-xs font-bold ${earned ? "text-yellow-300" : "text-slate-500"}`}>
        {label}
      </p>
      <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
    </div>
  );
}
