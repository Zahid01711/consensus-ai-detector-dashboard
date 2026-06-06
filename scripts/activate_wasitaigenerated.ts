import { PrismaClient } from '@prisma/client';
import { encrypt } from '../src/lib/encryption';

const prisma = new PrismaClient();

async function main() {
  const WAI_KEY = process.env.WASITAIGENERATED_API_KEY;

  if (!WAI_KEY) {
    console.error('Error: WASITAIGENERATED_API_KEY is not defined in environment variables.');
    process.exit(1);
  }

  // ── 1. Disable ALL providers first ──────────────────────────────────────
  await prisma.providerConfig.updateMany({
    data: { isEnabled: false, isMockMode: true },
  });
  console.log('All providers disabled.');

  // ── 2. Keep Sapling live ─────────────────────────────────────────────────
  await prisma.providerConfig.update({
    where: { key: 'sapling' },
    data: { isEnabled: true, isMockMode: false },
  });
  console.log('Sapling: ENABLED (live)');

  // ── 3. Upsert WasItAIGenerated ────────────────────────────────────────────
  const encryptedKey = encrypt(WAI_KEY);
  await prisma.providerConfig.upsert({
    where: { key: 'wasitaigenerated' },
    update: {
      apiKeyEncrypted: encryptedKey,
      isEnabled: true,
      isMockMode: false,
    },
    create: {
      key: 'wasitaigenerated',
      name: 'WasItAIGenerated',
      apiKeyEncrypted: encryptedKey,
      isEnabled: true,
      isMockMode: false,
    },
  });
  console.log('WasItAIGenerated: ENABLED (live key stored)');

  // ── 4. Print final status ─────────────────────────────────────────────────
  const all = await prisma.providerConfig.findMany({
    select: { key: true, name: true, isEnabled: true, isMockMode: true },
    orderBy: { name: 'asc' },
  });
  console.log('\n── Provider Status ──────────────────────────────');
  for (const p of all) {
    const status = p.isEnabled ? (p.isMockMode ? '🟡 Mock' : '🟢 Live') : '⚫ Off';
    console.log(`  ${status}  ${p.name}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
