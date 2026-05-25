// components/AppLayout.jsx — Sidebar layout with dark/light mode toggle
import {
  Activity, Brain, Layers, Clock, Settings,
  LogOut, Moon, Sun, Home, User,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function AppLayout({ user, onLogout, children, activePage, onNavigate }) {
  const { dark, toggle } = useTheme();

  const navItems = [
    { id: "dashboard", icon: <Home size={18} />, label: "Dashboard" },
    { id: "predict",   icon: <Brain size={18} />, label: "Predict" },
    { id: "twin",      icon: <Layers size={18} />, label: "Digital Twin" },
    { id: "history",   icon: <Clock size={18} />, label: "History" },
    { id: "profile",   icon: <User size={18} />, label: "Profile" },
    // Admin link only shown to ADMIN role users
    ...(user.role === "ADMIN"
      ? [{ id: "admin", icon: <Settings size={18} />, label: "Admin" }]
      : []),
  ];

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: "#050d1a", color: "#e8f4f8",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Sidebar */}
      <div style={{
        width: 240, background: "#0a1628",
        borderRight: "1px solid #1a2e4a",
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh",
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px", borderBottom: "1px solid #1a2e4a" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36,
                background: "linear-gradient(135deg,#00d4aa,#6c63ff)",
                borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Activity size={20} color="#fff" />
              </div>
              <span style={{
                fontSize: 18, fontWeight: 800,
                background: "linear-gradient(135deg,#00d4aa,#6c63ff)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                GlucoTwin
              </span>
            </div>
            {/* Fix 5a: Dark/light mode toggle — now actually wired up */}
            <button
              onClick={toggle}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
              style={{
                background: "rgba(255,255,255,0.05)", border: "1px solid #1a2e4a",
                borderRadius: 8, padding: "6px 8px", cursor: "pointer",
                color: "#6b8ca8", display: "flex", alignItems: "center",
              }}
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", borderRadius: 12, border: "none",
                cursor: "pointer", marginBottom: 4, fontSize: 14, fontWeight: 600,
                transition: "all 0.2s", textAlign: "left",
                background:
                  activePage === item.id
                    ? "linear-gradient(135deg,rgba(0,212,170,0.15),rgba(108,99,255,0.15))"
                    : "transparent",
                color: activePage === item.id ? "#00d4aa" : "#6b8ca8",
                borderLeft:
                  activePage === item.id
                    ? "2px solid #00d4aa"
                    : "2px solid transparent",
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: "16px 12px", borderTop: "1px solid #1a2e4a" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 14px", marginBottom: 8,
          }}>
            <div style={{
              width: 34, height: 34,
              background: "linear-gradient(135deg,#00d4aa,#6c63ff)",
              borderRadius: 10, display: "flex", alignItems: "center",
              justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff",
            }}>
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{user.name}</div>
              <div style={{ fontSize: 11, color: "#6b8ca8" }}>{user.role}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderRadius: 10, border: "none",
              background: "rgba(255,71,87,0.1)", color: "#ff4757",
              cursor: "pointer", fontSize: 13, fontWeight: 600,
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
        {children}
      </div>
    </div>
  );
}
