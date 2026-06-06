import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
  
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // Security: log failed login attempt
      await logAudit({
        email: email.toLowerCase(),
        action: 'LOGIN_FAILED',
        details: 'User not found in system',
        ipAddress,
      });
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      await logAudit({
        userId: user.id,
        email: user.email,
        action: 'LOGIN_FAILED',
        details: 'Password verification failed',
        ipAddress,
      });
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session cookie
    await createSession(user.id, user.email, user.role as 'ADMIN' | 'STUDENT', user.name);

    // Write audit log
    await logAudit({
      userId: user.id,
      email: user.email,
      action: 'LOGIN_SUCCESS',
      details: `Successful sign-in. Role: ${user.role}`,
      ipAddress,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
