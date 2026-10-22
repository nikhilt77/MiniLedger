import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { runMigrations } from './db/migrate';
import authRouter from './routes/auth';
import loansRouter from './routes/loans';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRouter);
app.use('/loans', loansRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Startup ──────────────────────────────────────────────────────────────────
async function start() {
  try {
    await runMigrations();
    app.listen(PORT, () => {
      console.log(`\n🚀 MiniLedger API running on http://localhost:${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/health\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
