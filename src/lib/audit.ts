import { prisma } from './db';

interface AuditLogOptions {
  userId?: string;
  email?: string;
  action: string;
  details: Record<string, any> | string;
  ipAddress?: string;
}

/**
 * Creates a system audit log record in the database.
 * Does not block execution (fails silently if DB fails to log).
 */
export async function logAudit({
  userId,
  email,
  action,
  details,
  ipAddress,
}: AuditLogOptions): Promise<void> {
  try {
    const serializedDetails = typeof details === 'string' ? details : JSON.stringify(details);
    
    await prisma.auditLog.create({
      data: {
        userId,
        email,
        action,
        details: serializedDetails,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error('[AUDIT ERROR] Failed to write audit log:', error);
  }
}
export default logAudit;
