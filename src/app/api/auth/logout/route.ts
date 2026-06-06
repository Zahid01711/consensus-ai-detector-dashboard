import { NextRequest, NextResponse } from 'next/server';
import { deleteSession, getSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';

    if (session) {
      await logAudit({
        userId: session.userId,
        email: session.email,
        action: 'LOGOUT',
        details: 'User logged out and session cookie destroyed.',
        ipAddress,
      });
    }

    await deleteSession();

    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
export async function GET(req: NextRequest) {
  return POST(req); // support GET requests for convenience
}
