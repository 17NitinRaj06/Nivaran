# 🌿 Nivaran — Hyperlocal Civic Issue Reporting Platform

Empower your community by reporting, tracking, and resolving civic issues — one report at a time.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Maps | React Leaflet + OpenStreetMap |
| Authentication | Firebase Auth (Google + Email/Password) |
| Database | Firestore |
| Storage | Firebase Storage |
| Backend | Node.js + Express.js |
| AI | Google Gemini API (server-side) |
| Icons | React Icons |

## Features

- 🔐 **Authentication** — Google Sign-In & Email/Password
- 📍 **Geo-Tagged Reports** — Pin issues on OpenStreetMap
- 🤖 **AI-Assisted Reporting** — Gemini analyzes photos & suggests categories
- 📊 **Dashboard** — Feed & Map views with filters
- 🏆 **Gamification** — Points system & achievement badges
- 🥇 **Leaderboard** — Top community contributors
- 💬 **AI Chatbot** — Floating assistant for platform help
- 🛡️ **Security** — Protected routes, rate limiting, Firebase rules

## Badges

| Badge | Requirement | Icon |
|-------|------------|------|
| First Responder | 1 report | 🌱 |
| Community Watcher | 5 reports | 👁️ |
| Neighborhood Hero | 15 reports | 🛡️ |
| Civic Champion | 30 reports | 🏆 |

## Project Structure

```
nivaran/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # Navbar, BadgeDisplay
│   │   │   ├── landing/    # Hero, About, Impact, Awareness, Footer
│   │   │   ├── auth/       # (reserved)
│   │   │   ├── dashboard/  # Sidebar, Header, FeedCard, FilterBar
│   │   │   ├── map/        # MapView with Leaflet
│   │   │   └── chatbot/    # ChatbotWidget
│   │   ├── pages/          # Landing, Login, Signup, Dashboard, ReportIssue, etc.
│   │   ├── context/        # AuthContext
│   │   ├── services/       # Firebase, FirestoreService
│   │   ├── layouts/        # MainLayout, AuthLayout, DashboardLayout
│   │   ├── utils/          # (reserved for utilities)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── backend/
│   ├── routes/             # ai.js, reports.js, users.js
│   ├── controllers/        # aiController, reportController, userController
│   ├── middleware/         # auth, rateLimit, upload
│   ├── firebase/           # admin.js
│   ├── utils/              # (reserved)
│   ├── server.js
│   ├── .env
│   └── package.json
├── firebase-rules/
│   ├── firestore.rules
│   └── storage.rules
└── README.md
```

## Setup & Installation

### Prerequisites

- Node.js v18+
- Firebase project with Authentication, Firestore, and Storage enabled
- Google Gemini API key

### 1. Clone and Install Dependencies

```bash
git clone <repo-url>
cd nivaran

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install
```

### 2. Firebase Configuration

Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com).

**Enable services:**
- Authentication (Google + Email/Password)
- Firestore Database (start in test mode, then apply rules from `firebase-rules/`)
- Storage (apply rules from `firebase-rules/storage.rules`)

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
FRONTEND_URL=http://localhost:5173
```

Generate the service account key in Firebase Console: Project Settings → Service Accounts → Generate New Private Key.

### 4. Run Development Servers

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:5000`.

## Deployment

### Frontend (Vite build)

```bash
cd frontend
npm run build
# Deploy the dist/ folder to Vercel, Netlify, or Firebase Hosting
```

### Backend (Node.js)

```bash
cd backend
npm start
# Deploy to Railway, Render, Fly.io, or Cloud Run
```

Set the same environment variables on your deployment platform.

## Security

- **Firestore rules**: Only authenticated users can create/update their own reports. Points and badges are server-managed.
- **Storage rules**: Only authenticated users can upload images (max 5MB). Public read access.
- **Rate limiting**: Express rate limiting on all API endpoints (100 req/15min general, 10 reports/hour, 30 upvotes/min, 5 AI analyses/min).
- **Protected routes**: Frontend routes are guarded; unauthenticated users are redirected to login.
- **No self-upvoting**: Backend prevents users from upvoting their own reports.
- **Duplicate upvote prevention**: Toggle-based upvote system prevents double-counting.

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check |
| POST | `/api/ai/analyze` | No | Analyze image with Gemini |
| GET | `/api/reports` | No | List reports (query params: category, status, userId, limit) |
| GET | `/api/reports/:id` | No | Get single report |
| POST | `/api/reports` | Yes | Create report |
| PATCH | `/api/reports/:id/status` | Yes | Update report status |
| POST | `/api/reports/:id/upvote` | Yes | Toggle upvote |
| GET | `/api/users/leaderboard` | No | Get leaderboard |
| GET | `/api/users/:id` | No | Get user profile |

## Color Palette

- **Forest Green**: `#2d6e34`, `#3b8a42`, `#1c3b20`
- **Sage Green**: `#689a50`, `#86b36e`, `#accc99`
- **Warm Beige**: `#bc9a61`, `#d7c6a2`, `#f3efe4`
- **Soft White**: `#fafaf9`
- **Earth Brown**: `#835c40`, `#584031`, `#34271a`

## License

MIT

---

Built with ❤️ for stronger communities.
