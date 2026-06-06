import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decryptSession } from './lib/session';

const COOKIE_NAME = 'session';

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Public routes that don't need auth checks (except if logged in we redirect)
  const isLoginRoute = path.startsWith('/login');
  
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await decryptSession(token) : null;

  // Root redirect
  if (path === '/') {
    if (session) {
      return NextResponse.redirect(
        new URL(session.role === 'ADMIN' ? '/admin' : '/student', req.url)
      );
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // If not logged in and trying to access protected routes, redirect to login
  if (!session && !isLoginRoute) {
    if (
      path.startsWith('/admin') ||
      path.startsWith('/student') ||
      path.startsWith('/reports')
    ) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // If logged in and trying to access login, redirect to dashboard
  if (session && isLoginRoute) {
    return NextResponse.redirect(
      new URL(session.role === 'ADMIN' ? '/admin' : '/student', req.url)
    );
  }

  // Role-based authorization
  if (session) {
    if (path.startsWith('/admin') && session.role !== 'ADMIN') {
      // Students cannot access admin paths
      return NextResponse.redirect(new URL('/student', req.url));
    }
    if (path.startsWith('/student') && session.role !== 'STUDENT') {
      // Admins cannot access student paths (redirect them to admin dashboard)
      return NextResponse.redirect(new URL('/admin', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/admin/:path*',
    '/student/:path*',
    '/reports/:path*',
  ],
};
