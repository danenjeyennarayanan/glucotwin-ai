# GlucoTwin AI — Frontend Integration Guide

This guide explains the **minimal, targeted changes** needed to wire the
existing `GlucoTwinAI.jsx` to the production backend. The UI design is
preserved 100%.

---

## 1. Install dependencies & set environment variables

```bash
cd glucotwin-frontend
cp .env.example .env.local
# Edit .env.local — set REACT_APP_API_BASE to your backend URL
npm install
```

---

## 2. Import the API service at the top of GlucoTwinAI.jsx

Add this line right after the existing imports:

```js
import api, { storage, ApiError } from './api';
```

---

## 3. Replace the mock `AuthPage.handleSubmit` with a real API call

**Find** (~line 354):
```js
function handleSubmit() {
  setError("");
  if (mode === "signup" && !form.name) { setError("Name is required."); return; }
  if (!form.email || !form.password) { setError("All fields required."); return; }
  setLoading(true);
  setTimeout(() => {
    setLoading(false);
    const user = { name: form.name || form.email.split("@")[0], email: form.email, role: form.email.includes("admin") ? "ADMIN" : "USER" };
    onLogin(user);
  }, 1200);
}
```

**Replace with**:
```js
async function handleSubmit() {
  setError("");
  if (mode === "signup" && !form.name.trim()) { setError("Name is required."); return; }
  if (!form.email || !form.password) { setError("All fields required."); return; }
  setLoading(true);
  try {
    const resp = mode === "login"
      ? await api.auth.login({ email: form.email, password: form.password })
      : await api.auth.register({ name: form.name, email: form.email, password: form.password });

    storage.setToken(resp.token);
    storage.setUser(resp);
    onLogin({ name: resp.name, email: resp.email, role: resp.role, userId: resp.userId });
  } catch (err) {
    setError(err instanceof ApiError ? err.message : "Connection error. Please try again.");
  } finally {
    setLoading(false);
  }
}
```

---

## 4. Replace the mock `PredictPage.handlePredict` with a real API call

**Find** (~line 508):
```js
function handlePredict() {
  setLoading(true);
  setTimeout(() => {
    const result = predictDiabetes(form);
    onResult({ ...result, input: form, timestamp: new Date().toISOString() });
    setLoading(false);
  }, 2000);
}
```

**Replace with** (the component needs a `user` prop — see step 5):
```js
async function handlePredict() {
  setLoading(true);
  setError("");
  try {
    const result = await api.health.predict(form, user.userId);
    onResult({
      riskPercentage: result.risk_percentage,
      riskLevel:      result.risk_level,
      prediction:     result.prediction,
      confidence:     result.confidence,
      factors:        (result.factors || []).map(f => ({
        feature: f.feature,
        impact:  f.impact,
        value:   "",
        unit:    "",
      })),
      disclaimer: result.disclaimer,
      input:      form,
      timestamp:  new Date().toISOString(),
    });
  } catch (err) {
    setError(err instanceof ApiError ? err.message : "Prediction failed. Please try again.");
  } finally {
    setLoading(false);
  }
}
```

Also add an error display above the buttons in PredictPage:
```jsx
{error && (
  <div style={{ background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)",
    borderRadius: 10, padding: "12px 16px", color: "#ff4757", marginBottom: 16, fontSize: 13 }}>
    {error}
  </div>
)}
```

---

## 5. Pass `user` into PredictPage

**Find** (~line 1023):
```jsx
{page === "predict" && !showResult && <PredictPage onResult={handleResult} />}
```

**Replace with**:
```jsx
{page === "predict" && !showResult && <PredictPage onResult={handleResult} user={user} />}
```

And update the function signature (~line 486):
```js
function PredictPage({ onResult, user }) {
```

---

## 6. Restore session on page refresh

In the main `GlucoTwinApp` component, add a `useEffect` at the top:

```js
// Restore session from sessionStorage on refresh
useEffect(() => {
  const savedUser = storage.getUser();
  const token     = storage.getToken();
  if (savedUser && token) {
    setUser(savedUser);
    setPage("dashboard");
  }

  // Listen for token expiry events
  const onExpired = () => {
    setUser(null);
    setPage("login");
    setHistory([]);
    setLatestResult(null);
    setShowResult(false);
  };
  window.addEventListener("glucotwin:session-expired", onExpired);
  return () => window.removeEventListener("glucotwin:session-expired", onExpired);
}, []);
```

---

## 7. Clear storage on logout

**Find** the `handleLogout` function (~line 980):
```js
function handleLogout() {
  setUser(null);
  setPage("landing");
  ...
}
```

Add `storage.clear();` as the first line:
```js
function handleLogout() {
  storage.clear();
  setUser(null);
  ...
}
```

---

## 8. Add medical disclaimer to ResultsPage

In `ResultsPage`, after the existing risk gauge card, add:

```jsx
{result.disclaimer && (
  <div style={{ background: "rgba(255,165,2,0.08)", border: "1px solid rgba(255,165,2,0.3)",
    borderRadius: 12, padding: "12px 16px", color: "#ffa502", fontSize: 12,
    marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 8 }}>
    <span>⚕️</span>
    <span>{result.disclaimer}</span>
  </div>
)}
```

---

## 9. Add admin route protection (already partially there)

The existing code already guards `<AdminPage>` with `user.role === "ADMIN"` ✓.
With the real JWT, the role comes directly from the backend — no client-side guessing.

---

## Summary of files changed

| File | What changed |
|------|-------------|
| `GlucoTwinAI.jsx` | 7 targeted edits (auth, predict, logout, session restore, disclaimer) |
| `src/api.js` | New — all HTTP calls |
| `.env.local` | New — backend URL |

The `predictDiabetes` client-side function can remain as a **fallback** for
the Digital Twin page which uses it for instant simulation sliders.
