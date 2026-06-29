# 🌿 Nivaran — Hyperlocal Civic Issue Reporting Platform

> **निवारण** — *"resolution."* Restoring trust between citizens and civic authorities.

Nivaran lets citizens report, validate, track, and resolve civic issues — potholes, water leaks, broken streetlights, garbage pile-ups — through one unified, AI-powered, multilingual platform. Built for **Vibe2Ship** (Coding Ninjas × Google for Developers), under the **"Community Hero — Hyperlocal Problem Solver"** problem statement.

[![Live Demo](https://nivaran-173290946365.asia-south1.run.app/) &nbsp;•&nbsp; [![Project Report](https://icons8.com/icon/ZSYgDi4fFbDc/google-docs--v2))](https://drive.google.com/file/d/1ihxp0EZtpXKnqh-C4gg3ahCD2EHZqx6Z/view?usp=sharing) &nbsp;•&nbsp; [![Pitch Deck](#)](#)
<!-- Replace the # above with your deployed link, report, and deck once ready -->
 
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)
![Gemini](https://img.shields.io/badge/Gemini%202.5%20Flash-8E75B2?logo=googlegemini&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Table of Contents

- [The Problem](#the-problem)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Google Technologies Used](#google-technologies-used)
- [Gamification](#gamification)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Deployment](#deployment)
- [Security](#security)
- [API Endpoints](#api-endpoints)
- [Color Palette](#color-palette)
- [Acknowledgments](#acknowledgments)
- [Author](#author)
- [License](#license)

---

## The Problem

Civic complaints in Indian cities are scattered across phone calls, WhatsApp groups, and disconnected municipal apps. The same pothole gets reported 20 times by 20 different people, emergencies sit in the same queue as routine complaints, and ~88% of the population can't use English-only civic apps. Nivaran fixes this with one transparent, trackable, multilingual pipeline from **report → verify → assign → track → resolve**.

## Key Features

**For Citizens**
- 📸 **AI Photo & Video Reporting** — Gemini auto-detects the issue category and writes the description
- 🎙️ **Multilingual, Start to Finish** — full interface in English, Hindi & Bengali; type or speak your report (Web Speech API)
- 🧩 **Smart Duplicate Detection** — matching reports are merged instead of piling up (keyword-match threshold)
- 🚨 **Emergency SOS Flagging** — life-threatening issues jump to the top of every officer's queue
- 📍 **Geo-Tagged Reports** — pin issues on an interactive Leaflet/OpenStreetMap view with heatmap & clustering
- 👍 **Community Upvotes** — 5+ upvotes auto-verifies a report, no bureaucratic delay needed
- 🔔 **Real-Time Notifications** — city-wide alerts when a new (especially emergency) report appears nearby

**For Officers & Admins**
- 🛠️ **AI Resolution Plans** — Gemini drafts step-by-step fix plans per report
- 🎯 **AI-Suggested Officer Assignment** — Gemini matches the right officer based on workload & category
- 📈 **Predictive Insights** — hotspot scoring, trend forecasting, and escalation-risk flags
- 🗂️ **Role-Based Dashboards** — separate citizen / officer / admin views with granular permissions
- 🧾 **PDF Export** — generate individual or bulk complaint reports (jsPDF)
- 📊 **Analytics Charts** — category trends, status breakdowns, officer workload (Recharts)

**Platform-Wide**
- 🕒 **Real-Time Status Tracking** — a 5-stage timeline: Pending → Verified → Assigned → In Progress → Resolved
- 💬 **AI Chatbot** — floating assistant for platform help
- 🛡️ **Security** — protected routes, role checks, rate limiting, Firebase rules

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Maps & Geocoding | React Leaflet + OpenStreetMap (Nominatim) |
| Localization | i18next + react-i18next (English, Hindi, Bengali) |
| Charts | Recharts |
| PDF Export | jsPDF + jsPDF-AutoTable |
| Icons | React Icons |
| Authentication | Firebase Auth (Google + Email/Password) |
| Database | Firestore |
| Media Storage | Cloudinary (image & video uploads, CDN delivery) |
| Backend | Node.js + Express.js |
| AI | Google Gemini 2.5 Flash (server-side) |
| Voice Input | Web Speech API + MediaRecorder |

> Cloudinary is used for media storage instead of Firebase Storage — it gives free built-in image transformations, a CDN, and support for video uploads up to 50MB.

## Google Technologies Used

| Technology | Role in Nivaran |
|---|---|
| **Firebase Auth & Firestore** | Secure sign-in and the real-time database behind reports, users, and notifications |
| **Gemini 2.5 Flash** | Multimodal AI for image analysis, resolution-plan generation, and smart officer assignment |
| **Google AI Studio** | Used to prototype and test Gemini prompts during development |
| **Web Speech API (Chrome)** | Powers Hindi & English voice-to-text so citizens can report hands-free |

## Gamification

Points: **+10** per report submitted · **+20** per resolution confirmed · **+1** per upvote received.

| Badge | Requirement | Icon |
|-------|------------|------|
| First Responder | 1 report | 🌱 |
| Community Watcher | 5 reports | 👁️ |
| Neighborhood Hero | 15 reports | 🛡️ |
| Civic Champion | 30 reports | 🏆 |

A public leaderboard ranks top community contributors.

## Project Structure

```
nivaran/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chatbot/      # Floating FAQ chatbot widget
│   │   │   ├── dashboard/    # DashboardHeader, FeedCard, FilterBar, Sidebar
│   │   │   ├── landing/      # Hero, About, Impact, Awareness, Footer
│   │   │   ├── map/          # EnhancedMapView (heatmap+clustering), MapView
│   │   │   ├── skeletons/    # Loading skeletons
│   │   │   ├── tracking/     # TrackingTimeline
│   │   │   ├── ui/           # Navbar, BadgeDisplay, LogoSpinner
│   │   │   └── voice/        # VoiceRecorder (STT + audio)
│   │   ├── context/          # AuthContext (Firebase auth state)
│   │   ├── hooks/            # useReports, useTranslation
│   │   ├── i18n/              # en.js, hi.js, bn.js
│   │   ├── layouts/          # MainLayout, AuthLayout, DashboardLayout
│   │   ├── pages/
│   │   │   ├── admin/        # AdminDashboard, AdminDatabase, PredictiveInsights
│   │   │   ├── officer/      # OfficerDashboard
│   │   │   └── *.jsx         # Landing, Login, Signup, Dashboard, ReportIssue, etc.
│   │   └── services/         # firebase.js, firestoreService.js, notificationsService.js
│   └── utils/                # badgeAvatar, constants, duplicateDetection, geocode
├── backend/
│   ├── controllers/
│   │   ├── adminController.js       # Firestore CRUD with field whitelisting
│   │   ├── agenticController.js     # Auto-assign, escalation, Gemini resolution plans
│   │   ├── aiController.js          # Gemini image analysis & description generation
│   │   ├── predictiveController.js  # Hotspot scoring, trend forecasting
│   │   ├── reportController.js      # CRUD, upvote, auto-verify, duplicate detection
│   │   ├── uploadController.js      # Cloudinary media upload
│   │   └── userController.js        # User fetch, leaderboard
│   ├── middleware/            # auth (verifyToken, requireRole), rateLimit, upload
│   ├── routes/                # admin/, agentic.js, ai.js, duplicate.js, reports.js, upload.js, users.js
│   ├── firebase/              # admin.js (Firebase Admin SDK init)
│   └── server.js              # Express entry (CORS, helmet, rate limits)
├── firebase-rules/
│   ├── firestore.rules
│   └── storage.rules
└── README.md
```

## Setup & Installation

### Prerequisites

- Node.js v18+
- Firebase project with Authentication and Firestore enabled
- Cloudinary account (free tier)
- Google Gemini API key

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/17NitinRaj06/nivaran.git
cd nivaran

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install
```

### 2. Firebase Configuration

Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com).

**Enable:**
- Authentication (Google + Email/Password)
- Firestore Database (start in test mode, then apply rules from `firebase-rules/firestore.rules`)

### 3. Environment Variables

**Frontend (`frontend/.env`):**

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:5000/api
```

**Backend (`backend/.env`):**

```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=http://localhost:5173
```

Generate the Firebase service account key via Project Settings → Service Accounts → Generate New Private Key.

> ⚠️ Never commit `.env` files or service account JSON keys. Make sure both are listed in `.gitignore` before your first commit.

### 4. Run Development Servers

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:5000`.

## Deployment

**Frontend (Vite build):**

```bash
cd frontend
npm run build
# Deploy the dist/ folder to Vercel, Netlify, or Firebase Hosting
```

**Backend (Node.js):**

```bash
cd backend
npm start
# Deploy to Railway, Render, Fly.io, or Cloud Run
```

Set the same environment variables on your deployment platform.

## Security

- **Firestore rules** — only authenticated users can create/update their own reports; points and badges are server-managed
- **Role-based access** — `requireRole` middleware gates officer/admin routes server-side, not just in the UI
- **Rate limiting** — separate limiters for general traffic, report creation, upvotes, and AI calls
- **Protected routes** — unauthenticated users are redirected to login; role mismatches are redirected away from gated dashboards
- **No self-upvoting** — backend blocks users from upvoting their own reports
- **Duplicate upvote prevention** — toggle-based upvote system prevents double-counting

## API Endpoints

> Reconstructed from the project's controllers/routes — double-check exact paths against your route files before relying on this table.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check |
| POST | `/api/ai/analyze` | No | Analyze image with Gemini (category + description) |
| GET | `/api/reports` | No | List reports (filter by category, status, userId, limit) |
| GET | `/api/reports/:id` | No | Get a single report |
| POST | `/api/reports` | Yes | Create a report |
| PATCH | `/api/reports/:id/status` | Yes | Update report status |
| POST | `/api/reports/:id/upvote` | Yes | Toggle upvote (auto-verifies at 5+) |
| DELETE | `/api/reports/:id` | Yes | Delete own report |
| POST | `/api/duplicate/check` | Yes | Check a new report against existing ones |
| GET | `/api/agentic/suggestions/:id` | Officer/Admin | Gemini-generated resolution plan |
| GET | `/api/agentic/suggest-assignment/:id` | Officer/Admin | Gemini-suggested officer assignment |
| POST | `/api/upload` | Yes | Upload media to Cloudinary |
| GET | `/api/users/:id` | No | Get user profile |
| GET | `/api/users/leaderboard` | No | Get leaderboard |
| GET | `/api/users/:id/notifications` | Yes | Get user's notifications |
| GET | `/api/admin/stats` | Admin | Platform-wide stats |
| GET | `/api/admin/predictive` | Admin | Hotspot & trend predictions |

## Color Palette

A custom forest/sage/beige/earth theme:

- **Forest Green**: `#2d6e34`, `#3b8a42`, `#1c3b20`
- **Sage Green**: `#689a50`, `#86b36e`, `#accc99`
- **Warm Beige**: `#bc9a61`, `#d7c6a2`, `#f3efe4`
- **Soft White**: `#fafaf9`
- **Earth Brown**: `#835c40`, `#584031`, `#34271a`

## Acknowledgments

Built for **Vibe2Ship**, a hackathon by **Coding Ninjas × Google for Developers**, under the *"Community Hero — Hyperlocal Problem Solver"* problem statement.

## Author

**Nitin Raj**
[LinkedIn](https://www.linkedin.com/in/nitin-raj-17d12/) · [GitHub](https://github.com/17NitinRaj06)

## License

MIT

---

Built with ❤️ for stronger communities.
