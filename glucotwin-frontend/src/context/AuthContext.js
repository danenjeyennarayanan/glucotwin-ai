// context/AuthContext.js — Authentication context for GlucoTwin AI
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import API, { stor, mapBackendRecord } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [latestResult, setLatestResult] = useState(null);

  const loadHistory = useCallback(async (userId) => {
    try {
      const records = await API.history(userId);
      const mapped = records.map((r) => mapBackendRecord(r));
      setHistory(mapped);
      if (mapped.length > 0) setLatestResult(mapped[mapped.length - 1]);
    } catch {}
  }, []);

  // Restore session on page refresh
  useEffect(() => {
    const savedUser = stor.getUser();
    const savedToken = stor.getToken();
    if (savedUser && savedToken) {
      setUser(savedUser);
      loadHistory(savedUser.userId);
    }

    const onExpired = () => {
      stor.clear();
      setUser(null);
      setHistory([]);
      setLatestResult(null);
    };
    window.addEventListener("gt:expired", onExpired);
    return () => window.removeEventListener("gt:expired", onExpired);
  }, [loadHistory]);

  const login = (resp) => {
    stor.setToken(resp.token);
    stor.setUser(resp);
    const u = {
      name: resp.name,
      email: resp.email,
      role: resp.role,
      userId: resp.userId,
    };
    setUser(u);
    loadHistory(u.userId);
    return u;
  };

  const logout = () => {
    stor.clear();
    setUser(null);
    setHistory([]);
    setLatestResult(null);
  };

  const addResult = (result) => {
    setLatestResult(result);
    setHistory((h) => [...h, result]);
  };

  // Updates user display name in both React state and sessionStorage
  const updateUser = (updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      stor.setUser(updated);
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, history, latestResult, login, logout, addResult, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
