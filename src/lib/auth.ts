import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

function getSecret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET || 'parinaam-2026-super-secret-key-change-in-production'
  );
}

function getAesKey() {
  return crypto
    .createHash('sha256')
    .update(process.env.JWT_SECRET || 'parinaam-2026-super-secret-key-change-in-production')
    .digest();
}

export type JWTPayload = {
  userId: string;
  email: string;
  role: 'student' | 'club_admin' | 'super_admin';
  clubId?: string;
  iat?: number;
  exp?: number;
};

export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

export async function signRegistrationToken(payload: Record<string, any>): Promise<string> {
  const payloadWithExpiry = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 7200, // 2 hours
  };
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getAesKey(), iv);
  let encrypted = cipher.update(JSON.stringify(payloadWithExpiry), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `enc_${iv.toString('hex')}_${authTag}_${encrypted}`;
}

export async function verifyRegistrationToken(token: string): Promise<Record<string, any> | null> {
  try {
    if (!token || !token.startsWith('enc_')) return null;
    const parts = token.slice(4).split('_');
    if (parts.length !== 3) return null;
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', getAesKey(), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    const payload = JSON.parse(decrypted);
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function getSessionUser(req?: NextRequest): Promise<JWTPayload | null> {
  let token: string | undefined;
  
  if (req) {
    token = req.cookies.get('parinaam_session')?.value;
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get('parinaam_session')?.value;
  }
  
  if (!token) return null;
  return verifyToken(token);
}

export const COOKIE_NAME = 'parinaam_session';
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
};
