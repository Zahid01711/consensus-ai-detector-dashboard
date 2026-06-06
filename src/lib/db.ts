import { PrismaClient } from '@prisma/client';

// Validate that DATABASE_URL is present to prevent cryptic Prisma connection crashes
if (!process.env.DATABASE_URL) {
  const setupError = `
========================================================================
❌ ENVIRONMENT DATABASE ERROR: DATABASE_URL is not configured!
========================================================================
Please ensure that a .env file exists in your project root containing:
DATABASE_URL="file:./dev.db"

To initialize the database locally, run the following commands:
1. npx prisma db push (creates database structure)
2. npx prisma db seed (seeds admin and student demo accounts)
========================================================================
`;
  console.error(setupError);
  throw new Error('DATABASE_URL is missing in process.env');
}

if (!process.env.JWT_SECRET) {
  console.warn(`
========================================================================
⚠️  SECURITY WARNING: JWT_SECRET is not configured!
========================================================================
Please define JWT_SECRET in your .env file for secure cookie signing.
Using a fallback secret for local development.
========================================================================
`);
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export default prisma;

