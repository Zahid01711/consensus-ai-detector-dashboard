import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-cookie-auth-key-change-me-in-production';
const KEY = new TextEncoder().encode(JWT_SECRET);
const COOKIE_NAME = 'session';

export interface SessionPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  name: string;
  expiresAt: Date;
}

export async function encryptSession(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(KEY);
}

export async function decryptSession(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, KEY, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function createSession(userId: string, email: string, role: 'ADMIN' | 'STUDENT', name: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await encryptSession({ userId, email, role, name, expiresAt });
  
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME)?.value;
  if (!session) return null;
  return await decryptSession(session);
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const session = req.cookies.get(COOKIE_NAME)?.value;
  if (!session) return null;
  return await decryptSession(session);
}
