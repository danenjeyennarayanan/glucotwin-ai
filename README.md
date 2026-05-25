# GlucoTwin AI 🩺

> AI-powered diabetes risk prediction platform  
> **React 18 · Spring Boot 3 · Flask · MySQL · Docker**

---

## 🧠 ML Model

- Algorithm: Random Forest (200 trees)
- Dataset: 100,000 patient records  
- Accuracy: **91.5%** | Diabetic Recall: **89%**
- Top features: HbA1c (39%), Blood Glucose (30%), Age (17%)
- Explainability: SHAP values per prediction
- **Pre-trained model included** — no retraining needed to run the app

---

## ✅ Tech Stack

| Layer | Tech | Status |
|---|---|---|
| Frontend | React 18, Recharts, Lucide, Framer Motion | ✅ Complete |
| Backend API | Spring Boot 3, JWT, JPA, Flyway | ✅ Complete |
| ML Service | Flask, Random Forest, SHAP | ✅ Complete |
| Database | MySQL 8 + Flyway migrations | ✅ Complete |
| Containerisation | Docker + docker-compose | ✅ Complete |
| Deployment configs | Vercel, Render, Netlify | ✅ Complete |
| AI Chatbot | Claude API proxied via Spring Boot | ✅ Complete |

---

## 🚀 Option 1 — Run with Docker (Recommended)

**Requires:** Docker Desktop installed and running.

```bash
# 1. Enter the project
cd glucotwin_v2_patched

# 2. Create your environment file from the template
cp .env.example .env
# Edit .env — at minimum change DB_PASSWORD and JWT_SECRET

# 3. Start everything (first run takes ~3–5 min to build)
docker-compose up --build
```

| Service | URL |
|---|---|
| 🌐 Frontend | http://localhost |
| 📡 Backend API | http://localhost:8080 |
| 📖 Swagger | http://localhost:8080/swagger-ui.html |
| 🤖 ML Service | http://localhost:5001/health |

**Default admin login:** `admin@glucotwin.ai` / `admin123`

> ⚠️ Change the admin password after first login in production.

---

## 🛠 Option 2 — Run Manually (Dev Mode)

```bash
# Terminal 1 — ML Service
cd glucotwin-ml
pip install -r requirements.txt
python ml_service.py
# Loads pre-trained model from model/diabetes_model.pkl automatically
# → http://localhost:5001/health

# Terminal 2 — Backend
cd glucotwin-backend
# Set environment variables (or use export):
export DB_URL=jdbc:mysql://localhost:3306/glucotwin_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
export DB_USERNAME=root
export DB_PASSWORD=yourpassword
export JWT_SECRET=your_32_char_secret_minimum_here!!
export ML_SERVICE_URL=http://localhost:5001
mvn clean spring-boot:run
# → http://localhost:8080

# Terminal 3 — Frontend
cd glucotwin-frontend
npm install
npm start
# → http://localhost:3000
```

---

## ☁️ Option 3 — Deploy to Cloud

### Frontend → Vercel

```bash
cd glucotwin-frontend
npx vercel
```

Set in Vercel dashboard → Environment Variables:
```
REACT_APP_API_BASE = https://your-backend.onrender.com
```

### Backend + ML → Render

1. Push the entire project to a GitHub repository
2. Go to [render.com](https://render.com) → New → Blueprint → connect repo
3. Render reads `render.yaml` automatically and creates both services
4. Set these secret env vars in Render dashboard for the **backend** service:
   - `DB_URL` — your MySQL connection string (Railway or PlanetScale recommended)
   - `DB_USERNAME` and `DB_PASSWORD`
   - `CORS_ORIGINS` — your Vercel frontend URL (no trailing slash)
   - `ANTHROPIC_API_KEY` — optional, for AI chatbot

> **Note on ML model:** The pre-trained `.pkl` files are committed to the repo.  
> Render's build command (`pip install -r requirements.txt`) skips retraining,  
> so the ML service starts instantly with the included model.

### Database → Railway

1. Go to [railway.app](https://railway.app) → New → MySQL
2. Copy the connection string → set as `DB_URL` in Render

---

## 🔑 Environment Variables Reference

### Backend (Spring Boot)

| Variable | Description | Default |
|---|---|---|
| `DB_URL` | MySQL JDBC connection string | localhost/glucotwin_db |
| `DB_USERNAME` | Database user | glucotwin |
| `DB_PASSWORD` | Database password | **required** |
| `JWT_SECRET` | JWT signing key (32+ chars) | **required** |
| `JWT_EXPIRATION` | Token expiry in ms | 86400000 (24h) |
| `ML_SERVICE_URL` | Flask ML service base URL | http://localhost:5001 |
| `CORS_ORIGINS` | Allowed frontend origins | http://localhost:3000 |
| `ANTHROPIC_API_KEY` | Claude API key for chatbot | empty (fallback used) |

### Frontend (React)

| Variable | Description |
|---|---|
| `REACT_APP_API_BASE` | Deployed Spring Boot backend URL |

---

## 📡 API Endpoints

```
POST /api/auth/register         Register new user
POST /api/auth/login            Login → JWT token
POST /api/auth/forgot-password  Password reset request
GET  /api/health/ping           Health check (no auth)
POST /api/health/predict        Submit prediction (auth required)
POST /api/health/simulate       Digital Twin simulation (auth required)
GET  /api/health/history/:uid   Prediction history (auth required)
GET  /api/health/latest/:uid    Latest record (auth required)
GET  /api/health/report/:id/pdf Download HTML report (auth required)
PUT  /api/user/profile          Update display name (auth required)
GET  /api/admin/users           All users (ADMIN only)
GET  /api/admin/stats           Platform stats (ADMIN only)
GET  /swagger-ui.html           Interactive API docs (no auth)
```

---

## 🧪 Running Tests

### Java (JUnit 5 + Mockito)

```bash
cd glucotwin-backend
mvn test
```

Covers: `AuthServiceTest`, `JwtUtilTest`, `HealthServiceTest`, `AuthControllerTest`

### Python (unittest)

```bash
cd glucotwin-ml
pip install pytest
pytest test_ml_service.py -v
```

Covers: risk classification boundaries, payload validation, preprocessing shape

---

## 📁 Project Structure

```
glucotwin_v2_patched/
├── .env.example              ← copy to .env before running docker-compose
├── docker-compose.yml
├── render.yaml               ← Render.com blueprint (auto-deploy)
├── netlify.toml              ← Netlify config (frontend only)
│
├── glucotwin-frontend/       ← React 18 SPA
│   ├── src/
│   │   ├── pages/            ← LandingPage, AuthPage, DashboardPage, PredictPage,
│   │   │                        ResultsPage, DigitalTwinPage, HistoryPage, AdminPage, ProfilePage
│   │   ├── components/       ← AppLayout, RiskGauge, ChatBot
│   │   ├── charts/           ← RiskCharts
│   │   ├── services/         ← api.js, constants.js
│   │   ├── hooks/            ← usePrediction.js
│   │   └── context/          ← AuthContext.js, ThemeContext.js
│   └── Dockerfile
│
├── glucotwin-backend/        ← Spring Boot 3 REST API
│   ├── src/main/java/com/glucotwin/
│   │   ├── controller/       ← AuthController, HealthController, AdminController,
│   │   │                        ChatController, UserController
│   │   ├── service/          ← AuthService, HealthService, MlService,
│   │   │                        ReportService, EmailService, UserService
│   │   ├── security/         ← JwtUtil, JwtAuthFilter, UserDetailsServiceImpl
│   │   ├── entity/           ← User, HealthRecord, Recommendation
│   │   └── config/           ← SecurityConfig, JpaConfig, OpenApiConfig
│   ├── src/main/resources/db/migration/
│   │   ├── V1__initial_schema.sql
│   │   └── V2__seed_data.sql
│   └── Dockerfile
│
└── glucotwin-ml/             ← Flask ML Microservice
    ├── ml_service.py         ← Flask API (/predict, /simulate, /feature-importance)
    ├── predict.py            ← CLI prediction script
    ├── shap_analysis.py      ← SHAP analysis module
    ├── train.py              ← Model training script (run locally if retraining)
    ├── requirements.txt
    ├── model/
    │   ├── diabetes_model.pkl    ← Pre-trained Random Forest (committed)
    │   └── shap_explainer.pkl    ← Pre-built SHAP explainer (committed)
    └── Dockerfile
```

---

## ⚠️ Known Limitations (for examiner transparency)

- **Forgot Password** — backend accepts the request and returns a success message, but email delivery requires configuring `MAIL_*` environment variables and setting `EMAIL_ENABLED=true`. In demo mode, reset emails are logged to the console only.
- **PDF Report** — generates a printable HTML report (`window.print()` → Save as PDF). A dedicated server-side PDF library (e.g. iText, WeasyPrint) could produce true PDFs in a production version.
- **Model retraining** — pre-trained model is included for convenience. To retrain: download the [Kaggle diabetes dataset](https://www.kaggle.com/datasets/iammustafatz/diabetes-prediction-dataset), place the CSV in `glucotwin-ml/`, and run `python train.py`.

