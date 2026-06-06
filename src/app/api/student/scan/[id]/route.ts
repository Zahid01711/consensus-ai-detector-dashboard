import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const scan = await prisma.scan.findUnique({
      where: { id },
      include: {
        document: true,
        jobs: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    // Access control: Students can only view their own scans. Admins can view any scan.
    if (session.role === 'STUDENT' && scan.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden. You do not own this scan.' }, { status: 403 });
    }

    // Get list of provider display names from provider configs
    const configs = await prisma.providerConfig.findMany();
    const configMap = new Map(configs.map((c) => [c.key, c.name]));

    // Format jobs with provider names
    const jobsWithNames = scan.jobs.map((job) => ({
      id: job.id,
      providerKey: job.providerKey,
      providerName: configMap.get(job.providerKey) || job.providerKey,
      status: job.status,
      score: job.score,
      errorMessage: job.errorMessage,
      durationMs: job.durationMs,
    }));

    return NextResponse.json({
      scan: {
        id: scan.id,
        combinedScore: scan.combinedScore,
        status: scan.status,
        errorMessage: scan.errorMessage,
        createdAt: scan.createdAt,
        updatedAt: scan.updatedAt,
      },
      document: {
        id: scan.document.id,
        title: scan.document.title,
        fileType: scan.document.fileType,
        fileSize: scan.document.fileSize,
        contentText: scan.document.contentText,
      },
      jobs: jobsWithNames,
      student: scan.user,
    });
  } catch (error) {
    console.error('Fetch scan status error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
