'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import {
  FileText,
  Key,
  Users,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileCheck,
  RefreshCw,
} from 'lucide-react';

interface Stats {
  totalScans: number;
  failedScans: number;
  activeProviders: number;
  totalStudents: number;
}

interface RecentScan {
  id: string;
  combinedScore: number | null;
  status: string;
  createdAt: string;
  document: {
    title: string;
    fileType: string;
    fileSize: number;
  };
  user: {
    name: string;
    email: string;
  };
}

interface RecentActivity {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  user?: {
    name: string;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentScans(data.recentScans);
        setRecentActivity(data.recentActivity);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-slate-100 text-slate-650';
    if (score < 20) return 'bg-emerald-50 text-emerald-700 border-emerald-250';
    if (score < 50) return 'bg-amber-50 text-amber-700 border-amber-250';
    return 'bg-red-50 text-red-700 border-red-250';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Success</span>;
      case 'PROCESSING':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">Running</span>;
      case 'PENDING':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-600 border border-slate-200">Pending</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-50 text-red-700 border border-red-200">Failed</span>;
    }
  };

  const getActivityDescription = (log: RecentActivity) => {
    try {
      const parsed = JSON.parse(log.details);
      if (log.action === 'SCAN_START') {
        return `Started scan for "${parsed.fileName}" using [${parsed.providers.join(', ')}]`;
      }
      if (log.action === 'SCAN_COMPLETE') {
        return `Completed scan. Combined score: ${parsed.combinedScore !== null ? Math.round(parsed.combinedScore) + '%' : 'N/A'}`;
      }
      return log.details;
    } catch (_) {
      return log.details;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-900" />
      </div>
    );
  }

  return (
    <>
      {/* Welcome & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Teacher Dashboard</h2>
          <p className="text-sm text-slate-500">Monitor AI detection providers, student reviewers, and uploaded documents</p>
        </div>
        <button
          onClick={fetchData}
          disabled={isRefreshing}
          className="flex items-center space-x-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="bg-indigo-100/80 text-indigo-900 p-3.5 rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Scans</p>
              <h3 className="text-2xl font-bold text-indigo-950 mt-0.5">{stats?.totalScans || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="bg-emerald-100/80 text-emerald-950 p-3.5 rounded-lg">
              <Key className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Platforms</p>
              <h3 className="text-2xl font-bold text-indigo-950 mt-0.5">{stats?.activeProviders || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="bg-red-100/80 text-red-950 p-3.5 rounded-lg">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Failed Runs</p>
              <h3 className="text-2xl font-bold text-indigo-950 mt-0.5">{stats?.failedScans || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="bg-slate-100 text-slate-900 p-3.5 rounded-lg">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Student Accounts</p>
              <h3 className="text-2xl font-bold text-indigo-950 mt-0.5">{stats?.totalStudents || 0}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Scans Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Reviews</CardTitle>
                <CardDescription>Documents scanned by student accounts</CardDescription>
              </div>
              <Link
                href="/admin/audits"
                className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-800 hover:text-indigo-950"
              >
                <span>View Audits</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentScans.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No scans have been run yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">AI Risk</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentScans.map((scan) => (
                    <TableRow key={scan.id}>
                      <TableCell>
                        <div className="font-semibold text-slate-900 max-w-[200px] truncate" title={scan.document.title}>
                          {scan.document.title}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center space-x-1.5 mt-0.5">
                          <span className="uppercase text-[10px] bg-slate-100 px-1 py-0.2 rounded font-mono">
                            {scan.document.fileType}
                          </span>
                          <span>•</span>
                          <span>{formatFileSize(scan.document.fileSize)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-700">{scan.user.name}</div>
                        <div className="text-xs text-slate-400 truncate max-w-[120px]">{scan.user.email}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(scan.status)}</TableCell>
                      <TableCell className="text-center">
                        {scan.status === 'COMPLETED' && scan.combinedScore !== null ? (
                          <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg border ${getScoreColor(scan.combinedScore)}`}>
                            {Math.round(scan.combinedScore)}%
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/reports/${scan.id}`}
                          className="inline-flex items-center justify-center p-1.5 text-slate-450 hover:text-indigo-850 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Open PDF & Detailed Report"
                        >
                          <FileCheck className="h-4.5 w-4.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Activity Logs Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle>Student Activity</CardTitle>
            <CardDescription>Recent upload and scanning events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {recentActivity.length === 0 ? (
              <div className="text-center text-sm text-slate-500 py-4">
                No activity logs available.
              </div>
            ) : (
              recentActivity.map((log) => (
                <div key={log.id} className="flex space-x-3 text-xs leading-normal">
                  <div className="w-1.5 h-1.5 bg-indigo-700 rounded-full mt-1.5 shrink-0" />
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-450">
                      <span className="font-semibold uppercase tracking-wider text-indigo-900">
                        {log.action.replace('_', ' ')}
                      </span>
                      <span>
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium">
                      {getActivityDescription(log)}
                    </p>
                    {log.user && (
                      <p className="text-[10px] text-slate-400">By {log.user.name}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
