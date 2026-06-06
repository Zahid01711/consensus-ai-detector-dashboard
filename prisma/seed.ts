import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PROVIDERS = [
  { key: 'gptzero', name: 'GPTZero' },
  { key: 'copyleaks', name: 'Copyleaks' },
  { key: 'sapling', name: 'Sapling' },
  { key: 'brandwell', name: 'BrandWell (Content at Scale)' },
  { key: 'originality', name: 'Originality.ai' },
  { key: 'winston', name: 'Winston AI' },
  { key: 'writer', name: 'Writer (Placeholder - Manual Setup)' },
  { key: 'crossplag', name: 'Crossplag (Placeholder - Manual Setup)' },
  { key: 'zerogpt', name: 'ZeroGPT (Placeholder - Manual Setup)' },
];

async function main() {
  console.log('Seeding database...');

  // 1. Create Default Admin/Teacher
  const adminPasswordHash = await bcrypt.hash('AdminPass123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@school.edu' },
    update: {},
    create: {
      email: 'admin@school.edu',
      name: 'Dr. Mohan',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });
  console.log('Admin user created:', admin.email);

  // 2. Create Default Students
  const studentPasswordHash = await bcrypt.hash('StudentPass123', 10);
  const student1 = await prisma.user.upsert({
    where: { email: 'student1@school.edu' },
    update: {},
    create: {
      email: 'student1@school.edu',
      name: 'Alice Student',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
    },
  });
  console.log('Student 1 created:', student1.email);

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@school.edu' },
    update: {},
    create: {
      email: 'student2@school.edu',
      name: 'Bob Reviewer',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
    },
  });
  console.log('Student 2 created:', student2.email);

  // 3. Create Default Provider Configs
  const providerConfigs = [];
  for (const p of PROVIDERS) {
    const config = await prisma.providerConfig.upsert({
      where: { key: p.key },
      update: {},
      create: {
        key: p.key,
        name: p.name,
        isEnabled: p.key === 'gptzero' || p.key === 'copyleaks' || p.key === 'sapling', // Enable a few by default for testing
        isMockMode: true, // Run in mock mode initially
      },
    });
    providerConfigs.push(config);
  }
  console.log(`Created/verified ${providerConfigs.length} provider configs.`);

  // 4. Assign Permissions
  // Student 1 gets access to GPTZero, Sapling, and Copyleaks
  const s1AllowedKeys = ['gptzero', 'sapling', 'copyleaks'];
  for (const key of s1AllowedKeys) {
    const prov = providerConfigs.find(c => c.key === key);
    if (prov) {
      await prisma.userPermission.upsert({
        where: {
          userId_providerId: {
            userId: student1.id,
            providerId: prov.id,
          },
        },
        update: {},
        create: {
          userId: student1.id,
          providerId: prov.id,
        },
      });
    }
  }
  console.log('Permissions assigned for Student 1');

  // Student 2 gets access to GPTZero, Originality, and BrandWell
  const s2AllowedKeys = ['gptzero', 'originality', 'brandwell'];
  for (const key of s2AllowedKeys) {
    const prov = providerConfigs.find(c => c.key === key);
    if (prov) {
      await prisma.userPermission.upsert({
        where: {
          userId_providerId: {
            userId: student2.id,
            providerId: prov.id,
          },
        },
        update: {},
        create: {
          userId: student2.id,
          providerId: prov.id,
        },
      });
    }
  }
  console.log('Permissions assigned for Student 2');

  // 5. System Settings
  await prisma.systemSettings.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      retentionDays: 30,
      fileLimitMb: 10,
      weightsJson: JSON.stringify({
        gptzero: 1,
        copyleaks: 1,
        sapling: 1,
        brandwell: 1,
        originality: 1,
        winston: 1,
      }),
    },
  });
  console.log('Default system settings seeded.');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
