import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Active Provider Configurations ===');
  const providers = await prisma.providerConfig.findMany();
  for (const provider of providers) {
    console.log(`- ${provider.name} (${provider.key}):`);
    console.log(`  Enabled: ${provider.isEnabled}`);
    console.log(`  Mock Mode: ${provider.isMockMode}`);
    console.log(`  Has API Key: ${!!provider.apiKeyEncrypted}`);
  }

  console.log('\n=== Recent Scans ===');
  const recentScans = await prisma.scan.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      jobs: true,
      document: {
        select: {
          title: true,
          contentText: true,
        }
      }
    }
  });

  for (const scan of recentScans) {
    console.log(`\nScan ID: ${scan.id}`);
    console.log(`Status: ${scan.status}`);
    console.log(`Combined Score: ${scan.combinedScore}`);
    console.log(`Error Message: ${scan.errorMessage}`);
    console.log(`Document Title: ${scan.document.title}`);
    console.log(`Content Length: ${scan.document.contentText.length} chars (${scan.document.contentText.split(/\s+/).length} words)`);
    console.log('Jobs:');
    for (const job of scan.jobs) {
      console.log(`  - Job ID: ${job.id}`);
      console.log(`    Provider: ${job.providerKey}`);
      console.log(`    Status: ${job.status}`);
      console.log(`    Score: ${job.score}`);
      console.log(`    Error: ${job.errorMessage}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
