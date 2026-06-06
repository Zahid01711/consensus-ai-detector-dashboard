import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

const JobStatus = {
  FAILED: 'FAILED'
};

const Role = {
  STUDENT: 'STUDENT'
};

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Total Scans Count
    const totalScans = await prisma.scan.count();

    // 2. Failed Scans Count
    const failedScans = await prisma.scan.count({
      where: { status: JobStatus.FAILED },
    });

    // 3. Active Providers Count
    const activeProviders = await prisma.providerConfig.count({
      where: { isEnabled: true },
    });

    // 4. Total Students Count
    const totalStudents = await prisma.user.count({
      where: { role: Role.STUDENT },
    });

    // 5. Recent Scans list
    const recentScans = await prisma.scan.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        document: {
          select: {
            title: true,
            fileType: true,
            fileSize: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // 6. Recent Audit logs for student activity
    const recentActivity = await prisma.auditLog.findMany({
      where: {
        action: {
          in: ['SCAN_START', 'SCAN_COMPLETE', 'LOGIN_SUCCESS', 'STUDENT_CREATE'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      stats: {
        totalScans,
        failedScans,
        activeProviders,
        totalStudents,
      },
      recentScans,
      recentActivity,
    });
  } catch (error) {
    console.error('Fetch stats API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
