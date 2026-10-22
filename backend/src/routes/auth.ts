import { Router, Request, Response } from 'express';
import { query } from '../db';
import { generateToken } from '../middleware/auth';

const router = Router();

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /auth/send-otp
 * Body: { phone: string }
 * Creates or finds user, generates mock OTP, prints it to server log.
 */
router.post('/send-otp', async (req: Request, res: Response): Promise<void> => {
  const { phone } = req.body;

  if (!phone || typeof phone !== 'string') {
    res.status(400).json({ error: 'Valid phone number is required' });
    return;
  }

  const normalizedPhone = phone.trim().replace(/\s+/g, '');

  if (!/^\+?[1-9]\d{6,14}$/.test(normalizedPhone)) {
    res.status(400).json({ error: 'Invalid phone number format' });
    return;
  }

  try {
    // Upsert user
    await query(
      `INSERT INTO users (phone) VALUES ($1) ON CONFLICT (phone) DO NOTHING`,
      [normalizedPhone]
    );

    // Invalidate previous unused OTPs
    await query(
      `UPDATE otp_store SET used = TRUE WHERE phone = $1 AND used = FALSE`,
      [normalizedPhone]
    );

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await query(
      `INSERT INTO otp_store (phone, otp, expires_at) VALUES ($1, $2, $3)`,
      [normalizedPhone, otp, expiresAt]
    );

    // MOCK: Print OTP to server log instead of sending SMS
    console.log(`\n==============================`);
    console.log(`📱 MOCK OTP for ${normalizedPhone}: ${otp}`);
    console.log(`   Expires at: ${expiresAt.toISOString()}`);
    console.log(`==============================\n`);

    res.json({
      message: 'OTP sent successfully (check server logs)',
      phone: normalizedPhone,
    });
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).json({ error: 'Failed to generate OTP' });
  }
});

/**
 * POST /auth/verify-otp
 * Body: { phone: string, otp: string }
 * Verifies OTP and returns JWT token.
 */
router.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    res.status(400).json({ error: 'Phone and OTP are required' });
    return;
  }

  const normalizedPhone = phone.trim().replace(/\s+/g, '');

  try {
    // Look up valid, unused OTP
    const otpResult = await query(
      `SELECT id FROM otp_store
       WHERE phone = $1
         AND otp = $2
         AND used = FALSE
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [normalizedPhone, otp.trim()]
    );

    if (otpResult.rows.length === 0) {
      res.status(401).json({ error: 'Invalid or expired OTP' });
      return;
    }

    // Mark OTP as used
    await query(`UPDATE otp_store SET used = TRUE WHERE id = $1`, [
      otpResult.rows[0].id,
    ]);

    // Get user
    const userResult = await query(
      `SELECT id, phone FROM users WHERE phone = $1`,
      [normalizedPhone]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = userResult.rows[0];
    const token = generateToken(user.id, user.phone);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, phone: user.phone },
    });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

export default router;
