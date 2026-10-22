import { query } from '../db';

export async function runMigrations(): Promise<void> {
  console.log('🔄 Running database migrations...');

  // Users table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      phone       VARCHAR(20) UNIQUE NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // OTP table (temporary storage for mock OTPs)
  await query(`
    CREATE TABLE IF NOT EXISTS otp_store (
      id          SERIAL PRIMARY KEY,
      phone       VARCHAR(20) NOT NULL,
      otp         VARCHAR(6) NOT NULL,
      expires_at  TIMESTAMPTZ NOT NULL,
      used        BOOLEAN DEFAULT FALSE,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Loans table
  await query(`
    CREATE TABLE IF NOT EXISTS loans (
      id            SERIAL PRIMARY KEY,
      user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      friend_name   VARCHAR(100) NOT NULL,
      amount        NUMERIC(12, 2) NOT NULL,
      due_date      DATE NOT NULL,
      note          TEXT,
      is_repaid     BOOLEAN DEFAULT FALSE,
      repaid_at     TIMESTAMPTZ,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Indexes for faster queries
  await query(`
    CREATE INDEX IF NOT EXISTS loans_user_id_idx ON loans(user_id);
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS loans_due_date_idx ON loans(due_date);
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS otp_phone_idx ON otp_store(phone);
  `);

  console.log('✅ Migrations complete.');
}

// Allow running standalone: ts-node src/db/migrate.ts
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
