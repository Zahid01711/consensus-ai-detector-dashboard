import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        role: session.role,
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
