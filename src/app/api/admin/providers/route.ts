import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { encrypt } from '@/lib/encryption';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providers = await prisma.providerConfig.findMany({
      orderBy: { name: 'asc' },
    });

    // Strip sensitive fields but indicate configuration status
    const sanitizedProviders = providers.map((p) => ({
      id: p.id,
      key: p.key,
      name: p.name,
      isEnabled: p.isEnabled,
      isMockMode: p.isMockMode,
      isConfigured: !!p.apiKeyEncrypted,
      hasAdditionalConfig: !!p.additionalConfig,
    }));

    return NextResponse.json({ providers: sanitizedProviders });
  } catch (error) {
    console.error('Fetch providers API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, isEnabled, isMockMode, apiKey, additionalConfig } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    const existingProvider = await prisma.providerConfig.findUnique({
      where: { id },
    });

    if (!existingProvider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const dataToUpdate: any = {
      isEnabled,
      isMockMode,
    };

    // Only encrypt and update key if a new one is supplied
    if (apiKey && apiKey.trim() !== '') {
      dataToUpdate.apiKeyEncrypted = encrypt(apiKey.trim());
    }

    // Only encrypt and update additional config if supplied
    if (additionalConfig !== undefined) {
      if (additionalConfig.trim() === '') {
        dataToUpdate.additionalConfig = null;
      } else {
        dataToUpdate.additionalConfig = encrypt(additionalConfig.trim());
      }
    }

    const updated = await prisma.providerConfig.update({
      where: { id },
      data: dataToUpdate,
    });

    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    await logAudit({
      userId: session.userId,
      email: session.email,
      action: 'PROVIDER_UPDATE',
      details: JSON.stringify({
        providerKey: updated.key,
        isEnabled,
        isMockMode,
        apiKeyUpdated: !!apiKey,
        additionalConfigUpdated: additionalConfig !== undefined,
      }),
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      provider: {
        id: updated.id,
        key: updated.key,
        name: updated.name,
        isEnabled: updated.isEnabled,
        isMockMode: updated.isMockMode,
        isConfigured: !!updated.apiKeyEncrypted,
      },
    });
  } catch (error) {
    console.error('Update provider API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
