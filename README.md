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

The server starts up on `http://localhost:3000`. 

You don't need to manually run any SQL scripts or migration commands—the server checks and automatically creates the required tables (`users`, `loans`, and `otp_store`) on startup.

#### How OTP login works (Local Dev)
We don't use real SMS gateways (Twilio/AWS SNS) for local development so you don't have to fiddle with API keys:

1. Open the mobile app and enter your phone number (e.g. `+91 98765 43210`).
2. Tap **Continue**.
3. Flip over to the terminal running the backend (`npm run dev`). You'll see a banner printed right in your logs:
   ```text
   ==============================
   📱 MOCK OTP for +919876543210: 482195
      Expires at: 2026-10-22T...
   ==============================
   ```
4. Enter that 6-digit number into the app, and you're in!

*(Tip: If you ever miss the log output, you can also grab the latest code directly from Postgres with: `psql -d miniledger -c "SELECT phone, otp FROM otp_store ORDER BY created_at DESC LIMIT 1;"`)*

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
