import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: number;
  userPhone?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      phone: string;
    };
    req.userId = payload.userId;
    req.userPhone = payload.phone;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function generateToken(userId: number, phone: string): string {
  return jwt.sign(
    { userId, phone },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
}
