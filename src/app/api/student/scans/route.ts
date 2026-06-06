import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== 'STUDENT' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scans = await prisma.scan.findMany({
      where: { userId: session.userId },
      include: {
        document: {
          select: {
            title: true,
            fileType: true,
            fileSize: true,
          },
        },
        jobs: {
          select: {
            providerKey: true,
            status: true,
            score: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ scans });
  } catch (error) {
    console.error('Fetch student scans error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
