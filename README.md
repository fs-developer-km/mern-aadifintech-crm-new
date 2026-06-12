# 🏦 Aadi FinLead OS — MEAN Stack CRM

DSA Lead Management System — same as `preview.html` but fully working with MongoDB + Express + React + Node.js.

---

## ✅ Features (100% matching preview.html)

- 🔐 **Role-based login** — ADMIN, MANAGER, RM, RESOURCE, EMPLOYEE
- 📊 **Command Dashboard** — pipeline funnel, source mix, RM performance, live activity feed
- 📋 **Lead Management** — search, filter by stage/RM, editable profile, WhatsApp, CSV export
- ➕ **Lead Capture** — auto assignment via product rules, full chain: Resource → RM → Manager
- 👥 **Team Members** — add/edit employees, password reset, reporting hierarchy
- 🔀 **Assignment Channel** — product routing rules, reporting tree, resource-RM mapping
- 📈 **Reports & MIS** — 10 filters, employee-wise table, bar charts, CSV export
- 🔒 **Access Control** — per-role screen permissions (checkbox matrix)
- 🎨 **Personalisation** — org name, theme colour, products, statuses, sources, docs, branches, custom fields

---

## 🚀 Run Locally (Method 1 — Recommended)

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`)

### Step 1 — Clone / Extract
```bash
cd finlead-mean
```

### Step 2 — Backend Setup
```bash
cd backend
cp .env.example .env       # edit if needed
npm install
npm run seed               # seeds MongoDB with demo data
npm run dev                # starts on http://localhost:5000
```

### Step 3 — Frontend Setup (new terminal)
```bash
cd frontend
npm install
npm run dev                # starts on http://localhost:5173
```

### Step 4 — Open Browser
```
http://localhost:5173
```

---

## 🐳 Run with Docker (Method 2)

```bash
docker-compose up --build
```
- Frontend → http://localhost:5173
- Backend API → http://localhost:5000/api
- MongoDB → localhost:27017

After containers start, seed the database:
```bash
docker exec finlead_backend node src/utils/seed.js
```

---

## 🔑 Demo Login Credentials

| Role     | Email                        | Password     |
|----------|------------------------------|--------------|
| ADMIN    | admin@aadi.local             | admin123     |
| MANAGER  | meera.manager@aadi.local     | manager123   |
| RM       | riya.rm@aadi.local           | rm123        |
| RM       | arjun.rm@aadi.local          | rm123        |
| RESOURCE | kabir.resource@aadi.local    | resource123  |
| RESOURCE | sana.resource@aadi.local     | resource123  |
| EMPLOYEE | desk@aadi.local              | employee123  |

> All visible on the login page — click any row to auto-fill credentials.

---

## 📁 Project Structure

```
finlead-mean/
├── backend/
│   ├── src/
│   │   ├── config/db.js           ← MongoDB connection
│   │   ├── models/
│   │   │   ├── User.js            ← User schema + bcrypt
│   │   │   ├── Lead.js            ← Lead schema (docs, timeline, calls)
│   │   │   └── Settings.js        ← Org, rules, permissions, picklists
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── leadController.js
│   │   │   ├── settingsController.js
│   │   │   └── reportController.js
│   │   ├── middleware/auth.js      ← JWT + requireRole
│   │   ├── routes/                ← Express routers
│   │   ├── utils/seed.js          ← Demo data seeder
│   │   └── server.js              ← Express + Socket.io entry
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── hooks/
│   │   │   ├── useAuth.jsx        ← Auth context + login/logout
│   │   │   ├── useToast.jsx       ← Toast notifications
│   │   │   └── useSettings.jsx    ← Global settings context
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Leads.jsx
│   │   │   ├── LeadDetail.jsx
│   │   │   ├── Capture.jsx
│   │   │   ├── Team.jsx
│   │   │   ├── Channel.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── Access.jsx
│   │   │   └── Personalisation.jsx
│   │   ├── components/AppShell.jsx ← Sidebar + nav
│   │   ├── utils/
│   │   │   ├── api.js             ← Axios + JWT interceptor
│   │   │   └── constants.js       ← Roles, stages, products
│   │   ├── styles/index.css       ← Exact same CSS as preview.html
│   │   ├── App.jsx                ← React Router routes
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
│
└── docker-compose.yml
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| GET | /api/users | List team (role-filtered) |
| POST | /api/users | Create user (ADMIN) |
| PATCH | /api/users/:id | Update user |
| POST | /api/users/:id/reset-password | Reset password |
| GET | /api/leads | List leads (role-filtered, paginated) |
| POST | /api/leads | Create lead |
| GET | /api/leads/stats | Dashboard stats |
| GET | /api/leads/:id | Get lead detail |
| PATCH | /api/leads/:id | Update lead |
| POST | /api/leads/:id/notes | Add note |
| PATCH | /api/leads/:id/docs/:index | Update doc status |
| DELETE | /api/leads/:id | Delete lead (ADMIN) |
| GET | /api/settings | All settings |
| PATCH | /api/settings/org | Update org |
| GET/POST | /api/settings/rules | Assignment rules |
| PATCH | /api/settings/permissions | Update permissions |
| POST | /api/settings/list/:name | Add to picklist |
| GET | /api/reports/mis | MIS report |
| GET | /api/reports/export/leads | CSV export |

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Database | MongoDB + Mongoose |
| Backend | Node.js + Express + JWT + bcrypt |
| Frontend | React 18 + Vite + React Router |
| Realtime | Socket.io |
| Styling | Pure CSS (same as preview.html) |
| Auth | JWT Bearer token |
