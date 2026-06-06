import { PrismaClient } from '@prisma/client';
import { encrypt } from '../src/lib/encryption';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting key insertion script...');

  const saplingKey = process.env.SAPLING_API_KEY;
  const copyleaksKey = process.env.COPYLEAKS_API_KEY;
  const copyleaksEmail = process.env.COPYLEAKS_EMAIL || 'ulislamjahid9@gmail.com';

  if (!saplingKey || !copyleaksKey) {
    console.error('Error: SAPLING_API_KEY or COPYLEAKS_API_KEY is not defined in environment variables.');
    process.exit(1);
  }

  // Encrypt the credentials from the environment
  const saplingKeyEncrypted = encrypt(saplingKey);
  const copyleaksKeyEncrypted = encrypt(copyleaksKey);
  const copyleaksConfigEncrypted = encrypt(JSON.stringify({ email: copyleaksEmail }));

  // 1. Disable all providers first
  await prisma.providerConfig.updateMany({
    data: {
      isEnabled: false,
      isMockMode: true,
    },
  });
  console.log('Disabled all providers and reset to mock mode.');

  // 2. Enable and configure Sapling
  const sapling = await prisma.providerConfig.update({
    where: { key: 'sapling' },
    data: {
      apiKeyEncrypted: saplingKeyEncrypted,
      isEnabled: true,
      isMockMode: false,
    },
  });
  console.log('Configured and enabled Sapling in production mode:', sapling.name);

  // 3. Enable and configure Copyleaks
  const copyleaks = await prisma.providerConfig.update({
    where: { key: 'copyleaks' },
    data: {
      apiKeyEncrypted: copyleaksKeyEncrypted,
      additionalConfig: copyleaksConfigEncrypted,
      isEnabled: true,
      isMockMode: false,
    },
  });
  console.log('Configured and enabled Copyleaks in production mode:', copyleaks.name);

  console.log('Credentials updated successfully!');
}

main()
  .catch((e) => {
    console.error('Failed to update credentials:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
