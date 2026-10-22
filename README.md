# MiniLedger 💸

A full-stack app to track money lent to friends — built with **Node.js + TypeScript + PostgreSQL** (backend) and **React Native (Expo)** (mobile).

## Project Structure

```
MiniLedger/
├── backend/          # REST API (Node.js + TypeScript + PostgreSQL)
└── mobile/           # React Native app (Expo)
```

---

## Backend Setup

### Prerequisites
- Node.js ≥ 18
- PostgreSQL (or Docker)

### 1. Start Database

```bash
# Easiest: spin up Postgres with Docker
docker-compose up -d
```

Or set up a local Postgres instance with DB `miniledger`.

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env to match your DB credentials
```

### 3. Install & Run

```bash
cd backend
npm install
npm run dev
```

The server starts on **http://localhost:3000** and auto-runs DB migrations.

> **Mock OTP**: When you request an OTP, it's printed in the server terminal — no real SMS is sent.

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/send-otp` | ❌ | Send mock OTP to phone |
| `POST` | `/auth/verify-otp` | ❌ | Verify OTP, get JWT |
| `GET`  | `/loans` | ✅ | List all loans |
| `POST` | `/loans` | ✅ | Add a new loan |
| `PATCH`| `/loans/:id/repay` | ✅ | Mark loan as repaid |
| `DELETE`| `/loans/:id` | ✅ | Delete a loan |
| `GET`  | `/loans/summary` | ✅ | Financial summary |
| `GET`  | `/health` | ❌ | Health check |

---

## Mobile Setup

### Prerequisites
- Node.js ≥ 18
- [Expo CLI](https://docs.expo.dev/get-started/installation/) or `npx expo`
- iOS Simulator / Android Emulator (or Expo Go on device)

### 1. Configure API URL

Edit `mobile/src/api/client.ts` and update `BASE_URL` for physical device:

```ts
const BASE_URL = __DEV__
  ? 'http://YOUR_MACHINE_IP:3000'   // ← change for physical device
  : 'https://your-production-api.com';
```

> For iOS Simulator, `localhost` works. For Android Emulator, use `10.0.2.2:3000`.

### 2. Install & Run

```bash
cd mobile
npm install
npm start        # Opens Expo dev menu
# Press i for iOS, a for Android
```

---

## Features

### Backend
- 📱 Phone number login with mock OTP (logged to server terminal)
- 🔐 JWT-based session tokens
- 📋 Full loan CRUD (add, list, mark repaid, delete)
- 📊 Summary endpoint: total lent, repaid, outstanding, overdue amount
- 🚨 Auto-detects overdue loans (due_date < today and not repaid)
- 🔄 DB migrations run on server startup

### Mobile App
- ✨ Premium dark UI with animated entrance and glow effects
- 🔐 Two-step login (phone → OTP)
- 📊 Summary card with total lent, repaid, outstanding, and overdue
- 📋 Filterable loan list (All / Pending / ⚠ Overdue / ✓ Repaid)
- ➕ Add loan form with quick date shortcuts (+1 week, +1 month…)
- ✓ Mark as repaid with one tap
- 🗑 Long-press to delete a loan
- 🔄 Pull-to-refresh
- 💅 Color-coded entries: purple (pending), red (overdue), green (repaid)
