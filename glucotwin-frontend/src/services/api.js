// services/api.js — API service layer for GlucoTwin AI

const BASE_URL =
  (typeof process !== "undefined" && process.env?.REACT_APP_API_BASE) ||
  "http://localhost:8080";

const TOKEN_KEY = "gt_token";
const USER_KEY = "gt_user";

// ── Session Storage ─────────────────────────────────────────────────────────
export const stor = {
  getToken: () => sessionStorage.getItem(TOKEN_KEY),
  setToken: (t) => sessionStorage.setItem(TOKEN_KEY, t),
  getUser: () => {
    try {
      return JSON.parse(sessionStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },
  setUser: (u) => sessionStorage.setItem(USER_KEY, JSON.stringify(u)),
  clear: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
};

// ── API Error ───────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(msg, status, fields = null) {
    super(msg);
    this.status = status;
    this.fields = fields;
  }
}

// ── Core Fetch ──────────────────────────────────────────────────────────────
export async function apiFetch(path, opts = {}) {
  const token = stor.getToken();
  const headers = { "Content-Type": "application/json", ...opts.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...opts, headers });

  if (res.status === 401) {
    stor.clear();
    window.dispatchEvent(new CustomEvent("gt:expired"));
    throw new ApiError("Session expired. Please log in again.", 401);
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      body?.message ||
      (body?.errors ? Object.values(body.errors).join(", ") : null) ||
      `Error ${res.status}`;
    throw new ApiError(msg, res.status, body?.errors);
  }
  return body?.data !== undefined ? body.data : body;
}

// ── Map backend HealthRecord → frontend result shape ────────────────────────
export function mapBackendRecord(r) {
  let factors = [];
  try {
    factors = JSON.parse(r.factorsJson || "[]");
  } catch {}
  return {
    recordId: r.id,           // ← needed by downloadReport
    riskPercentage: r.riskPercentage,
    riskLevel: r.riskLevel,
    prediction: r.prediction,
    factors,
    disclaimer:
      "This prediction is AI-assisted and not a medical diagnosis. Please consult a qualified healthcare professional for medical advice.",
    input: {
      gender: r.gender,
      age: r.age,
      hypertension: r.hypertension,
      heartDisease: r.heartDisease,
      smoking: r.smokingHistory,
      bmi: r.bmi,
      hba1c: r.hba1cLevel,
      glucose: r.bloodGlucoseLevel,
    },
    timestamp: r.createdAt || new Date().toISOString(),
  };
}

// ── API Methods ─────────────────────────────────────────────────────────────
const API = {
  register: (p) =>
    apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(p) }),

  login: (p) =>
    apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify(p) }),

  predict: (form, userId) =>
    apiFetch("/api/health/predict", {
      method: "POST",
      body: JSON.stringify({
        userId,
        gender: form.gender,
        age: form.age,
        hypertension: form.hypertension,
        heartDisease: form.heartDisease,
        smokingHistory: form.smoking,
        bmi: form.bmi,
        hba1cLevel: form.hba1c,
        bloodGlucoseLevel: form.glucose,
      }),
    }),

  history: (uid) => apiFetch(`/api/health/history/${uid}`),
  latest: (uid) => apiFetch(`/api/health/latest/${uid}`),
  adminUsers: () => apiFetch("/api/admin/users"),
  adminStats: () => apiFetch("/api/admin/stats"),

  simulate: async (base, modified) => {
    const mapForm = (f) => ({
      gender: f.gender,
      age: f.age,
      hypertension: f.hypertension ? 1 : 0,
      heart_disease: f.heartDisease ? 1 : 0,
      smoking_history: f.smoking,
      bmi: f.bmi,
      HbA1c_level: f.hba1c,
      blood_glucose_level: f.glucose,
    });
    // Routes through Spring Boot backend to avoid CORS issues in production
    return apiFetch("/api/health/simulate", {
      method: "POST",
      body: JSON.stringify({ base: mapForm(base), modified: mapForm(modified) }),
    });
  },

  chat: (message) =>
    apiFetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  forgotPassword: (email) =>
    apiFetch("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  updateProfile: (data) =>
    apiFetch("/api/user/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /**
   * Download health report as a printable HTML file (server-side generated).
   * Opens in a new tab so the user can Ctrl+P → Save as PDF.
   */
  downloadReport: (recordId) => {
    const token = stor.getToken();
    const url = `${BASE_URL}/api/health/report/${recordId}/pdf`;
    // Open in new tab with auth header via a hidden form POST trick,
    // or use fetch + blob for clean download:
    return fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Report download failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `glucotwin-report-${recordId}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      });
  },
};

export default API;
