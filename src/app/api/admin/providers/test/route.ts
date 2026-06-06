import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { getAdapter } from '@/lib/adapters';
import { decrypt } from '@/lib/encryption';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { providerKey, apiKey, isMockMode, additionalConfig } = await req.json();

    if (!providerKey) {
      return NextResponse.json({ error: 'Provider key is required' }, { status: 400 });
    }

    const adapter = getAdapter(providerKey);
    if (!adapter) {
      return NextResponse.json({ error: `Adapter not found for provider key: ${providerKey}` }, { status: 404 });
    }

    let testApiKey = apiKey;
    let testAdditionalConfig = additionalConfig;

    // If key not supplied, load from database and decrypt
    if (!testApiKey) {
      const dbConfig = await prisma.providerConfig.findUnique({
        where: { key: providerKey },
      });
      if (dbConfig && dbConfig.apiKeyEncrypted) {
        testApiKey = decrypt(dbConfig.apiKeyEncrypted);
        if (dbConfig.additionalConfig) {
          testAdditionalConfig = decrypt(dbConfig.additionalConfig);
        }
      }
    }

    // If still no key and not in mock mode, fail
    if (!testApiKey && !isMockMode) {
      return NextResponse.json({
        success: false,
        message: 'No API key provided or configured. In live mode, a key must be supplied.',
      });
    }

    // Execute connection test
    const finalKey = isMockMode ? 'MOCK_KEY' : testApiKey;
    try {
      const success = await adapter.testConnection(finalKey, testAdditionalConfig);
      return NextResponse.json({
        success,
        message: success ? 'Connection tested successfully!' : 'Connection test failed. Verify your key/config.',
      });
    } catch (e: any) {
      return NextResponse.json({
        success: false,
        message: e.message || 'Connection test failed with an error.',
      });
    }
  } catch (error) {
    console.error('Test connection API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
