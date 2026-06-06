'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Key,
  Users,
  ShieldAlert,
  Settings,
  LogOut,
  UploadCloud,
  FileSpreadsheet,
} from 'lucide-react';

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: 'ADMIN' | 'STUDENT';
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.refresh();
        router.push('/login');
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const adminNav = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Scan Document', href: '/admin/upload', icon: UploadCloud },
    { name: 'Provider Keys', href: '/admin/providers', icon: Key },
    { name: 'Student Accounts', href: '/admin/students', icon: Users },
    { name: 'Audit Logs', href: '/admin/audits', icon: ShieldAlert },
    { name: 'System Settings', href: '/admin/settings', icon: Settings },
  ];

  const studentNav = [
    { name: 'Dashboard & Upload', href: '/student', icon: UploadCloud },
  ];

  const navItems = user.role === 'ADMIN' ? adminNav : studentNav;

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-screen shrink-0">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="bg-indigo-700 text-white p-2 rounded-lg">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-bold text-sm text-white tracking-wider leading-none">AI MULTI-REVIEW</h1>
          <span className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">Detector Hub</span>
        </div>
      </div>

      {/* User profile info */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40">
        <p className="text-sm font-semibold text-white truncate">{user.name}</p>
        <p className="text-xs text-slate-400 truncate">{user.email}</p>
        <span className="inline-block mt-2 px-2 py-0.5 text-[9px] font-bold tracking-wider rounded bg-indigo-950 text-indigo-300 border border-indigo-900 uppercase">
          {user.role === 'ADMIN' ? 'Teacher / Admin' : 'Student Reviewer'}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-900 shadow-sm'
                  : 'hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <item.icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive ? 'text-indigo-400' : 'text-slate-450 group-hover:text-slate-200'
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/20">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-950/40 hover:text-red-200 hover:border-red-900/50 border border-transparent transition-all cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
