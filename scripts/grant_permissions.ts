import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const wai = await prisma.providerConfig.findUnique({ where: { key: 'wasitaigenerated' } });
  const sapling = await prisma.providerConfig.findUnique({ where: { key: 'sapling' } });
  const students = await prisma.user.findMany({ where: { role: 'STUDENT' } });
  console.log('Students:', students.length);

  for (const s of students) {
    if (wai) {
      await prisma.userPermission.upsert({
        where: { userId_providerId: { userId: s.id, providerId: wai.id } },
        update: {},
        create: { userId: s.id, providerId: wai.id },
      });
    }
    if (sapling) {
      await prisma.userPermission.upsert({
        where: { userId_providerId: { userId: s.id, providerId: sapling.id } },
        update: {},
        create: { userId: s.id, providerId: sapling.id },
      });
    }
  }
  console.log('Permissions granted: Sapling + WasItAIGenerated for all students.');
  await prisma.$disconnect();
}
main().catch(console.error);
