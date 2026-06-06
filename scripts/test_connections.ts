import { PrismaClient } from '@prisma/client';
import { decrypt } from '../src/lib/encryption';
import { getAdapter } from '../src/lib/adapters';

const prisma = new PrismaClient();

async function main() {
  const providers = await prisma.providerConfig.findMany({
    where: { key: { in: ['sapling', 'wasitaigenerated'] } }
  });

  for (const provider of providers) {
    console.log(`\nTesting connection for: ${provider.name} (${provider.key})`);
    if (!provider.apiKeyEncrypted) {
      console.log('No encrypted API key found.');
      continue;
    }
    const decryptedKey = decrypt(provider.apiKeyEncrypted);
    const adapter = getAdapter(provider.key);
    if (!adapter) {
      console.log('Adapter not found!');
      continue;
    }

    try {
      console.log('Testing connection via testConnection()...');
      const isConnected = await adapter.testConnection(decryptedKey);
      console.log(`Connection test result: ${isConnected ? 'SUCCESS' : 'FAILED'}`);

      console.log('Testing scanText() with a small text (10 words)...');
      const result = await adapter.scanText('This is a short sample sentence to check if the AI detector API accepts and scores it correctly.', decryptedKey);
      console.log('Scan result:', result);
    } catch (err: any) {
      console.error('Test threw an error:', err.message || err);
    }
  }
}

main().finally(() => prisma.$disconnect());
