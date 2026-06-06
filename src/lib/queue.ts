import { prisma } from './db';
import { getAdapter } from './adapters';
import { decrypt } from './encryption';

const JobStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

/**
 * Initiates the asynchronous background processing of a scan.
 * This runs outside of the HTTP request thread.
 */
export function queueScan(scanId: string): void {
  // Launch the promise in the background
  processScan(scanId).catch((error) => {
    console.error(`Background scan job failed critically for scan ${scanId}:`, error);
  });
}

/**
 * Background worker task that executes the scan jobs sequentially or in parallel.
 */
async function processScan(scanId: string): Promise<void> {
  const startTime = Date.now();
  console.log(`[QUEUE] Starting scan processing for scan: ${scanId}`);

  try {
    // 1. Fetch the Scan with document and pending jobs
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        document: true,
        jobs: true,
      },
    });

    if (!scan) {
      console.error(`[QUEUE] Scan ${scanId} not found.`);
      return;
    }

    // Update main scan status to PROCESSING
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: JobStatus.PROCESSING },
    });

    const textToScan = scan.document.contentText;

    // 2. Fetch all enabled providers from database to check keys & mock mode
    const providers = await prisma.providerConfig.findMany();
    const providerMap = new Map(providers.map((p) => [p.key, p]));

    // 3. Process each job
    for (const job of scan.jobs) {
      if (job.status !== JobStatus.PENDING) continue;

      const providerConfig = providerMap.get(job.providerKey);
      if (!providerConfig || !providerConfig.isEnabled) {
        // Provider is no longer available or disabled
        await prisma.scanJob.update({
          where: { id: job.id },
          data: {
            status: JobStatus.FAILED,
            errorMessage: 'Provider is disabled or not configured.',
          },
        });
        continue;
      }

      // Update job to PROCESSING
      await prisma.scanJob.update({
        where: { id: job.id },
        data: { status: JobStatus.PROCESSING },
      });

      const adapter = getAdapter(job.providerKey);
      if (!adapter) {
        await prisma.scanJob.update({
          where: { id: job.id },
          data: {
            status: JobStatus.FAILED,
            errorMessage: `Adapter for provider key "${job.providerKey}" was not found.`,
          },
        });
        continue;
      }

      const jobStartTime = Date.now();
      try {
        let apiKey = 'MOCK_KEY';
        let additionalConfig = providerConfig.additionalConfig || undefined;

        if (!providerConfig.isMockMode && providerConfig.apiKeyEncrypted) {
          apiKey = decrypt(providerConfig.apiKeyEncrypted);
          if (additionalConfig) {
            additionalConfig = decrypt(additionalConfig);
          }
        } else if (!providerConfig.isMockMode && !providerConfig.apiKeyEncrypted) {
          throw new Error('API key is missing in production mode.');
        }

        // Run the adapter
        const result = await adapter.scanText(textToScan, apiKey, additionalConfig);
        const durationMs = Date.now() - jobStartTime;

        // Save result
        await prisma.scanJob.update({
          where: { id: job.id },
          data: {
            status: JobStatus.COMPLETED,
            score: result.score,
            rawResponse: JSON.stringify(result.rawResponse),
            durationMs,
          },
        });
      } catch (err: any) {
        const durationMs = Date.now() - jobStartTime;
        console.error(`[QUEUE] Error scanning text for provider ${job.providerKey}:`, err);
        await prisma.scanJob.update({
          where: { id: job.id },
          data: {
            status: JobStatus.FAILED,
            errorMessage: err.message || 'Unknown provider error',
            durationMs,
          },
        });
      }
    }

    // 4. Calculate Combined Score (Simple Average of successful jobs)
    const finishedJobs = await prisma.scanJob.findMany({
      where: {
        scanId,
        status: JobStatus.COMPLETED,
        score: { not: null },
      },
    });

    let combinedScore: number | null = null;
    let finalStatus = JobStatus.FAILED;

    if (finishedJobs.length > 0) {
      const totalScore = finishedJobs.reduce((sum, j) => sum + (j.score || 0), 0);
      combinedScore = totalScore / finishedJobs.length;
      finalStatus = JobStatus.COMPLETED;
    } else {
      // Check if there are any failed jobs. If yes, it's failed. If no jobs existed, it's completed (0 results).
      const failedJobs = await prisma.scanJob.findMany({
        where: { scanId, status: JobStatus.FAILED },
      });
      if (failedJobs.length > 0) {
        finalStatus = JobStatus.FAILED;
      } else {
        finalStatus = JobStatus.COMPLETED;
      }
    }

    // 5. Update main scan record
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: finalStatus,
        combinedScore,
        errorMessage: finalStatus === JobStatus.FAILED ? 'All provider scans failed.' : null,
      },
    });

    // 6. Log in Audit log
    await prisma.auditLog.create({
      data: {
        userId: scan.userId,
        action: 'SCAN_COMPLETE',
        details: JSON.stringify({
          scanId,
          documentId: scan.documentId,
          totalJobs: scan.jobs.length,
          successfulJobs: finishedJobs.length,
          combinedScore,
          durationMs: Date.now() - startTime,
        }),
      },
    });

    console.log(`[QUEUE] Completed scan processing for scan: ${scanId}. Score: ${combinedScore}`);
  } catch (error: any) {
    console.error(`[QUEUE] Critically failed processing scan ${scanId}:`, error);
    
    // Attempt to set scan to FAILED
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: JobStatus.FAILED,
        errorMessage: error.message || 'Critical queue error occurred.',
      },
    }).catch(() => {});
  }
}
