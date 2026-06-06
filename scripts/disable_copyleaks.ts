import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Disable Copyleaks — AI detection requires paid enterprise plan
  const cl = await prisma.providerConfig.update({
    where: { key: 'copyleaks' },
    data: { isEnabled: false, isMockMode: true },
  });
  console.log('Copyleaks disabled:', cl.name, '| enabled:', cl.isEnabled, '| mock:', cl.isMockMode);

  // Confirm Sapling is still live and active
  const sp = await prisma.providerConfig.findUnique({ where: { key: 'sapling' } });
  console.log('Sapling:', sp?.name, '| enabled:', sp?.isEnabled, '| mock:', sp?.isMockMode);

  // Also remove any student permissions for Copyleaks so it doesn't appear in their list
  const deleted = await prisma.userPermission.deleteMany({
    where: {
      provider: { key: 'copyleaks' },
    },
  });
  console.log('Removed', deleted.count, 'Copyleaks student permission(s).');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
