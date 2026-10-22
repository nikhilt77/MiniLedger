# MiniLedger

A no-fuss app to keep track of money you've lent to friends, see who owes you what, and flag overdue repayments before they get awkward.

Built with a **Node.js/TypeScript** backend backed by **PostgreSQL**, and a **React Native (Expo)** mobile frontend.

---

## What it does

- **Phone login with mock OTP**: No SMS provider setup needed for local dev; the OTP just prints to your backend terminal.
- **Track IOUs**: Add entries with a friend's name, amount, due date, and an optional note.
- **Overdue tracking**: Automatically highlights loans that passed their due date without repayment.
- **Summary breakdown**: Total amount lent, repaid, remaining outstanding, and overdue totals at a glance.
- **One-tap settlement**: Mark loans as repaid as soon as your friend pays you back.
- **Filters**: Quickly toggle between pending, overdue, and settled loans.

---

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, PostgreSQL (`pg`), JWT
- **Mobile**: React Native, Expo (SDK 57), TypeScript, React Navigation

---

## Getting Started

### 1. Database

You need a running Postgres instance with a database named `miniledger`.

Using Docker:
```bash
docker-compose up -d
```

Or using local Postgres:
```bash
createdb miniledger
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The server runs on `http://localhost:3000`. Database schema and migrations run automatically on startup.

> **Mock OTP**: When you request an OTP from the app, the server logs the 6-digit code directly in the terminal where `npm run dev` is running. Type that code into the app to log in.

### 3. Mobile App

Make sure your phone and computer are on the same Wi-Fi network.

```bash
cd mobile
npm install
npm start
```

Scan the QR code with **Expo Go** on your phone (or press `i` for iOS simulator / `a` for Android emulator). The app automatically resolves your machine's local IP address to communicate with the backend.

---

## API Reference

| Endpoint | Method | Auth | What it does |
| --- | --- | --- | --- |
| `/auth/send-otp` | POST | No | Generates & logs a 6-digit mock OTP |
| `/auth/verify-otp` | POST | No | Exchanges phone + OTP for a JWT token |
| `/loans` | GET | Yes | Fetches all loans for logged-in user |
| `/loans` | POST | Yes | Creates a new loan entry |
| `/loans/:id/repay` | PATCH | Yes | Marks a loan as settled |
| `/loans/:id` | DELETE | Yes | Removes a loan entry |
| `/loans/summary` | GET | Yes | Returns aggregated totals (lent, repaid, overdue) |
| `/health` | GET | No | Basic server health check |

---

## Project Structure

```
MiniLedger/
├── backend/
│   ├── src/
│   │   ├── routes/        # Auth & loan endpoints
│   │   ├── db/            # Postgres pool and schema migrations
│   │   └── middleware/    # JWT auth verification
│   └── package.json
└── mobile/
    ├── src/
    │   ├── api/           # API client with dynamic host resolution
    │   ├── components/    # Summary card & loan list item cards
    │   ├── screens/       # Login, Home, and Add Loan screens
    │   └── theme.ts       # Styles and theme tokens
    └── App.tsx
```
