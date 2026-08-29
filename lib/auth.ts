import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'ittehad_committee_super_secret_jwt_key_2026_!@#';

export interface TokenPayload {
  userId: string;
  phone: string;
  role: 'admin' | 'member';
  memberId?: string | null;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function getUserFromRequest(req: NextRequest): TokenPayload | null {
  // Check Authorization header: Bearer <token>
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifyToken(token);
  }

  // Check HttpOnly Cookie: token
  const cookieToken = req.cookies.get('token')?.value;
  if (cookieToken) {
    return verifyToken(cookieToken);
  }

  return null;
}
