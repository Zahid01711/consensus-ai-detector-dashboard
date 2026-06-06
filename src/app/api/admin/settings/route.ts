import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings = await prisma.systemSettings.findFirst();

    // Seed defaults if empty
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: 'default-settings',
          retentionDays: 30,
          fileLimitMb: 10,
          weightsJson: '{}',
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Fetch settings API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { retentionDays, fileLimitMb, weightsJson } = await req.json();

    if (retentionDays === undefined || fileLimitMb === undefined) {
      return NextResponse.json({ error: 'Missing settings fields' }, { status: 400 });
    }

    // Upsert settings
    const settings = await prisma.systemSettings.upsert({
      where: { id: 'default-settings' },
      update: {
        retentionDays: parseInt(retentionDays, 10),
        fileLimitMb: parseInt(fileLimitMb, 10),
        weightsJson: weightsJson || '{}',
      },
      create: {
        id: 'default-settings',
        retentionDays: parseInt(retentionDays, 10),
        fileLimitMb: parseInt(fileLimitMb, 10),
        weightsJson: weightsJson || '{}',
      },
    });

    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    await logAudit({
      userId: session.userId,
      email: session.email,
      action: 'SYSTEM_SETTINGS_UPDATE',
      details: JSON.stringify({
        retentionDays: settings.retentionDays,
        fileLimitMb: settings.fileLimitMb,
        weightsJson: settings.weightsJson,
      }),
      ipAddress,
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Save settings API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
