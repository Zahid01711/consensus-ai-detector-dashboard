import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { logAudit } from '@/lib/audit';

const Role = {
  ADMIN: 'ADMIN',
  STUDENT: 'STUDENT'
};

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const students = await prisma.user.findMany({
      where: { role: Role.STUDENT },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        permissions: {
          select: {
            providerId: true,
            provider: {
              select: {
                key: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Fetch students error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, id, email, name, password, providerIds } = await req.json();

    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';

    if (action === 'create') {
      if (!email || !name || !password) {
        return NextResponse.json({ error: 'Email, name, and password are required' }, { status: 400 });
      }

      // Check existing email
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (existingUser) {
        return NextResponse.json({ error: 'Email is already registered' }, { status: 400 });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const newStudent = await prisma.$transaction(async (tx) => {
        const student = await tx.user.create({
          data: {
            email: email.toLowerCase().trim(),
            name: name.trim(),
            passwordHash,
            role: Role.STUDENT,
          },
        });

        // Add permissions if provided
        if (providerIds && Array.isArray(providerIds)) {
          const permissionData = providerIds.map((pId: string) => ({
            userId: student.id,
            providerId: pId,
          }));
          await tx.userPermission.createMany({
            data: permissionData,
          });
        }

        return student;
      });

      await logAudit({
        userId: session.userId,
        email: session.email,
        action: 'STUDENT_CREATE',
        details: `Created student reviewer account: ${newStudent.email} (Name: ${newStudent.name})`,
        ipAddress,
      });

      return NextResponse.json({ success: true, studentId: newStudent.id });
    }

    if (action === 'update_permissions') {
      if (!id || !providerIds || !Array.isArray(providerIds)) {
        return NextResponse.json({ error: 'Student ID and provider permission array are required' }, { status: 400 });
      }

      const student = await prisma.user.findUnique({
        where: { id, role: Role.STUDENT },
      });

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      await prisma.$transaction(async (tx) => {
        // Delete all old permissions
        await tx.userPermission.deleteMany({
          where: { userId: id },
        });

        // Add new permissions
        if (providerIds.length > 0) {
          const permissionData = providerIds.map((pId: string) => ({
            userId: id,
            providerId: pId,
          }));
          await tx.userPermission.createMany({
            data: permissionData,
          });
        }
      });

      await logAudit({
        userId: session.userId,
        email: session.email,
        action: 'STUDENT_PERMISSIONS_UPDATE',
        details: `Updated permissions for student: ${student.email}. Enabled provider IDs count: ${providerIds.length}`,
        ipAddress,
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
      }

      const student = await prisma.user.findUnique({
        where: { id, role: Role.STUDENT },
      });

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      await prisma.user.delete({
        where: { id },
      });

      await logAudit({
        userId: session.userId,
        email: session.email,
        action: 'STUDENT_DELETE',
        details: `Deleted student account: ${student.email}`,
        ipAddress,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Student API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
