# FarmBuddy - Smart Agriculture Ledger & Lab Management App

FarmBuddy is a comprehensive Web MVP designed to empower farmers with a digital bahi khata, crop-wise cost accounting, automated Kisan Credit Card (KCC) subvention interest tracking, and granular agriculture labor records.

---

## 🚀 Key Modules & Capabilities

### 🌾 Finance & Labour Accounts
A unified ledger system built directly into the batch cultivation workflow:
*   **Overview Dashboard**: Net crop profit margins, live cashflow cards, total revenue inflow, KCC outstanding indicators, and active labor cost widgets.
*   **Labour Records CRUD**: Comprehensive table detailing Worker Profile, Gender, Job Specifics, Crop, Plot, Hours Worked, Wage Rate, Bonus, and Advance. Computes totals dynamically: `(Hours Worked * Daily Wage) + Bonus - Advance`. Supports pagination, search, and gender/status filters.
*   **Digital Bahi Khata (Udhaar Directory)**: CRUD operations on local dealers/ Arthiyas with automatic running balance rollback calculations.
*   **Crop-wise Ledger**: Cost-accounting grid tracking running margins per crop variety and plot.
*   **KCC & Subsidy Tracker**: Dynamic usage bar and subvention target countdown timer alerts.
*   **Download & Print**: Styled PDF reports and Excel/CSV combined spreadsheets.

### 📋 Additional Features
*   **Batch Workflows**: Calendars, event logbooks, and traceability verification.
*   **IoT & Telemetry**: Simulated soil sensors and greenhouse climate alerts.
*   **Gamified Leaderboard**: Ranks and streaks updating dynamically upon task achievements.

---

## 🛠️ Technology Stack

*   **Frontend**: React (Context API), TailwindCSS (styled theme), Vite (bundler), Lucide React (icons), Recharts (data visualizations).
*   **Backend**: Node.js, Express REST API router.
*   **Database**: Dual-mode engine:
    *   **Production**: Relational Aiven MySQL database cluster.
    *   **Local Fallback**: File-system-based structured JSON document stores.

---

## 💻 Local Setup & Development

### 1. Requirements
*   Node.js (v22+)
*   MySQL Server (optional, falls back to JSON automatically if connection parameters are empty)

### 2. Startup Servers
Clone the repository, install dependencies in both project roots, and start the development processes:

```bash
# Start Backend Express API (Runs on port 3000)
cd server
npm install
node server.js

# Start Frontend Vite Dev Server (Runs on port 5173)
cd ..
npm install
npm run dev
```

### 3. Production Compilation Build
To verify type-safety and bundle efficiency for production:
```bash
npm run build
```
