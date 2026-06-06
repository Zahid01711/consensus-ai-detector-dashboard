import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { extractText } from '@/lib/extractor';
import { queueScan } from '@/lib/queue';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify session
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== 'STUDENT' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Login required.' }, { status: 401 });
    }

    // 2. Fetch system settings for file size limits
    const settings = await prisma.systemSettings.findFirst() || { fileLimitMb: 10 };
    const limitBytes = settings.fileLimitMb * 1024 * 1024;

    // 3. Parse Multipart form
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const providerKeysString = formData.get('providers') as string | null; // Optional: student selects from their allowed list

    if (!file) {
      return NextResponse.json({ error: 'No file was uploaded.' }, { status: 400 });
    }

    if (file.size > limitBytes) {
      return NextResponse.json({ error: `File size exceeds the limit of ${settings.fileLimitMb}MB.` }, { status: 400 });
    }

    // 4. Read file content as Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Extract text
    let parsedText = '';
    try {
      parsedText = await extractText(buffer, file.name);
    } catch (extractError: any) {
      return NextResponse.json({ error: extractError.message || 'Failed to extract text from document.' }, { status: 400 });
    }

    if (!parsedText || parsedText.trim().length < 50) {
      return NextResponse.json({ error: 'Extracted text is too short. Minimum 50 characters required for scanning.' }, { status: 400 });
    }

    // 6. Resolve allowed providers
    let permittedProviders = [];
    if (session.role === 'ADMIN') {
      permittedProviders = await prisma.providerConfig.findMany({
        where: { isEnabled: true },
      });
    } else {
      const userPermissions = await prisma.userPermission.findMany({
        where: { userId: session.userId },
        include: { provider: true },
      });
      permittedProviders = userPermissions
        .map((up) => up.provider)
        .filter((p) => p.isEnabled);
    }

    if (permittedProviders.length === 0) {
      return NextResponse.json(
        {
          error: session.role === 'ADMIN'
            ? 'No active AI-detection platforms are globally enabled. Please enable at least one under System Settings or Provider Keys.'
            : 'You do not have any active AI-detection platforms assigned. Please contact your instructor.'
        },
        { status: 400 }
      );
    }

    // If student selected specific providers, filter down to those
    if (providerKeysString) {
      try {
        const selectedKeys: string[] = JSON.parse(providerKeysString);
        if (selectedKeys.length > 0) {
          permittedProviders = permittedProviders.filter((p) => selectedKeys.includes(p.key));
        }
      } catch (_) {}
    }

    if (permittedProviders.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one valid AI-detection provider.' },
        { status: 400 }
      );
    }

    // 7. Write everything to Database
    const result = await prisma.$transaction(async (tx) => {
      // Create Document
      const document = await tx.document.create({
        data: {
          title: file.name,
          contentText: parsedText,
          fileType: file.name.split('.').pop() || 'txt',
          fileSize: file.size,
          userId: session.userId,
        },
      });

      // Create main Scan record
      const scan = await tx.scan.create({
        data: {
          documentId: document.id,
          userId: session.userId,
          status: 'PENDING',
        },
      });

      // Create ScanJob record for each provider
      const scanJobsData = permittedProviders.map((prov) => ({
        scanId: scan.id,
        providerKey: prov.key,
        status: 'PENDING' as const,
      }));

      await tx.scanJob.createMany({
        data: scanJobsData,
      });

      return { scanId: scan.id, documentId: document.id };
    });

    // 8. Log in Audit trail
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    await logAudit({
      userId: session.userId,
      email: session.email,
      action: 'SCAN_START',
      details: JSON.stringify({
        scanId: result.scanId,
        documentId: result.documentId,
        fileName: file.name,
        providers: permittedProviders.map((p) => p.key),
      }),
      ipAddress,
    });

    // 9. Queue background processing (Returns immediately)
    queueScan(result.scanId);

    return NextResponse.json({
      success: true,
      scanId: result.scanId,
    });
  } catch (error: any) {
    console.error('File upload/scan api error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
