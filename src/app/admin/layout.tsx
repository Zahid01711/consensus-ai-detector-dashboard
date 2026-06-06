import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import Sidebar from '@/components/Sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  const user = {
    name: session.name,
    email: session.email,
    role: session.role,
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Sidebar Panel */}
      <Sidebar user={user} />

      {/* Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Main Application Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
