'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, ChevronLeft, ChevronRight, Activity } from 'lucide-react';

interface AuditLogItem {
  id: string;
  userId: string | null;
  email: string | null;
  action: string;
  details: string;
  ipAddress: string | null;
  createdAt: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async (page: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/audits?page=${page}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setPagination(data.pagination);
        setCurrentPage(data.pagination.page);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(currentPage);
  }, [currentPage]);

  const getActionBadge = (action: string) => {
    const base = 'px-2.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider border ';
    switch (action) {
      case 'LOGIN_SUCCESS':
        return <span className={`${base} bg-emerald-50 text-emerald-705 border-emerald-200`}>Login OK</span>;
      case 'LOGIN_FAILED':
        return <span className={`${base} bg-red-50 text-red-700 border-red-200`}>Login Fail</span>;
      case 'SCAN_START':
        return <span className={`${base} bg-indigo-50 text-indigo-700 border-indigo-200`}>Scan Start</span>;
      case 'SCAN_COMPLETE':
        return <span className={`${base} bg-indigo-100 text-indigo-800 border-indigo-300`}>Scan Done</span>;
      case 'PROVIDER_UPDATE':
        return <span className={`${base} bg-amber-50 text-amber-700 border-amber-200`}>Provider Edit</span>;
      case 'STUDENT_CREATE':
        return <span className={`${base} bg-teal-50 text-teal-700 border-teal-250`}>User Add</span>;
      case 'STUDENT_DELETE':
        return <span className={`${base} bg-rose-50 text-rose-700 border-rose-250`}>User Del</span>;
      default:
        return <span className={`${base} bg-slate-100 text-slate-600 border-slate-200`}>{action.replace('_', ' ')}</span>;
    }
  };

  const parseLogDetails = (details: string) => {
    try {
      const parsed = JSON.parse(details);
      
      // Format details based on keys
      if (parsed.fileName) {
        return (
          <div>
            <p className="font-semibold text-slate-800">File: {parsed.fileName}</p>
            <p className="text-slate-500 mt-0.5">Providers: [{parsed.providers?.join(', ')}]</p>
          </div>
        );
      }
      if (parsed.providerKey) {
        return `Updated config for ${parsed.providerKey} (Enabled: ${parsed.isEnabled ? 'Yes' : 'No'}, Simulator: ${parsed.isMockMode ? 'Yes' : 'No'})`;
      }
      if (parsed.combinedScore !== undefined) {
        return `Scan finished. Score: ${parsed.combinedScore !== null ? Math.round(parsed.combinedScore) + '%' : 'N/A'} (${parsed.successfulJobs}/${parsed.totalJobs} providers completed)`;
      }

      return details;
    } catch (_) {
      return details;
    }
  };

  if (isLoading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-900" />
      </div>
    );
  }

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Security Audit Logs</h2>
        <p className="text-sm text-slate-500">Read-only immutable history of all system events, student logins, and scans</p>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>System Activity Ledger</CardTitle>
            <CardDescription>Records are kept for accountability and academic integrity audits</CardDescription>
          </div>
          <Activity className="h-5 w-5 text-slate-400" />
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              No audit logs have been recorded yet.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User / Account</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="align-top hover:bg-slate-50/30">
                      <TableCell className="text-xs text-slate-400 font-mono whitespace-nowrap pt-4">
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'medium',
                        })}
                      </TableCell>
                      <TableCell className="pt-4">
                        {log.user ? (
                          <div>
                            <div className="font-semibold text-slate-900 leading-tight">{log.user.name}</div>
                            <div className="text-xs text-slate-400 truncate max-w-[150px]">{log.user.email}</div>
                          </div>
                        ) : log.email ? (
                          <div className="text-slate-550 italic font-medium truncate max-w-[150px]" title={log.email}>
                            {log.email}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">System / Anon</span>
                        )}
                      </TableCell>
                      <TableCell className="pt-4">{getActionBadge(log.action)}</TableCell>
                      <TableCell className="text-slate-650 text-xs pt-4 max-w-sm whitespace-normal leading-relaxed">
                        {parseLogDetails(log.details)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-450 font-mono pt-4 whitespace-nowrap">
                        {log.ipAddress || 'unknown'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination Footer */}
              {pagination && pagination.totalPages > 1 && (
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} audit entries
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1 || isLoading}
                      className="px-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-semibold text-slate-700 px-2">
                      Page {currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, pagination.totalPages))}
                      disabled={currentPage === pagination.totalPages || isLoading}
                      className="px-2"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
