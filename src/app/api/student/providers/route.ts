import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== 'STUDENT' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let allowedProviders = [];
    if (session.role === 'ADMIN') {
      allowedProviders = await prisma.providerConfig.findMany({
        where: { isEnabled: true },
        select: {
          id: true,
          key: true,
          name: true,
          isMockMode: true,
        },
        orderBy: { name: 'asc' },
      });
    } else {
      // Fetch student's assigned permissions where provider is globally enabled
      const permissions = await prisma.userPermission.findMany({
        where: {
          userId: session.userId,
          provider: { isEnabled: true },
        },
        include: {
          provider: {
            select: {
              id: true,
              key: true,
              name: true,
              isMockMode: true,
            },
          },
        },
        orderBy: { provider: { name: 'asc' } },
      });
      allowedProviders = permissions.map((p) => p.provider);
    }

    return NextResponse.json({ providers: allowedProviders });
  } catch (error) {
    console.error('Fetch student allowed providers error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
