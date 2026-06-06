'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface JobProgress {
  id: string;
  providerKey: string;
  providerName: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  score: number | null;
  errorMessage: string | null;
  durationMs: number | null;
}

interface ScanData {
  scan: {
    id: string;
    combinedScore: number | null;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    errorMessage: string | null;
  };
  document: {
    title: string;
    fileType: string;
  };
  jobs: JobProgress[];
}

export default function AdminScanProgressPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [data, setData] = useState<ScanData | null>(null);
  const [error, setError] = useState('');
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (!id) return;

    let timer: NodeJS.Timeout;

    const pollScanStatus = async () => {
      try {
        const res = await fetch(`/api/student/scan/${id}`);
        if (!res.ok) {
          if (res.status === 403) {
            setError('Access Denied. You do not have permissions to view this scan.');
          } else {
            setError('Failed to fetch scan details.');
          }
          return;
        }

        const scanData: ScanData = await res.json();
        setData(scanData);

        // Count finished jobs
        const finished = scanData.jobs.filter(
          (j) => j.status === 'COMPLETED' || j.status === 'FAILED'
        ).length;
        setCompletedCount(finished);

        // If scan is fully completed or failed, stop polling
        if (scanData.scan.status === 'COMPLETED' || scanData.scan.status === 'FAILED') {
          return;
        }

        // Otherwise poll again
        timer = setTimeout(pollScanStatus, 1500);
      } catch (err) {
        console.error(err);
        setError('Connection error occurred.');
      }
    };

    pollScanStatus();

    return () => {
      clearTimeout(timer);
    };
  }, [id]);

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Card className="border-red-200">
          <CardHeader className="text-center">
            <XCircle className="h-10 w-10 text-red-650 mx-auto mb-2" />
            <CardTitle className="text-red-750">Access Denied</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push('/admin/upload')}>Back to Upload</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-900" />
        <span className="text-sm text-slate-500 font-medium">Loading scan task metadata...</span>
      </div>
    );
  }

  const totalJobs = data.jobs.length;
  const progressPercent = totalJobs > 0 ? Math.round((completedCount / totalJobs) * 100) : 0;
  const isFinished = data.scan.status === 'COMPLETED' || data.scan.status === 'FAILED';

  const getJobStatusIcon = (status: JobProgress['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-600 shrink-0" />;
      case 'PROCESSING':
        return <Loader2 className="animate-spin h-5 w-5 text-indigo-900 shrink-0" />;
      default:
        return <Clock className="h-5 w-5 text-slate-400 shrink-0" />;
    }
  };

  const getJobStatusText = (status: JobProgress['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="text-xs font-semibold text-emerald-700">Completed</span>;
      case 'FAILED':
        return <span className="text-xs font-semibold text-red-700">Failed</span>;
      case 'PROCESSING':
        return <span className="text-xs font-semibold text-indigo-700">Scanning document...</span>;
      default:
        return <span className="text-xs font-medium text-slate-400">Waiting in queue...</span>;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Document Scan in Progress</h2>
        <p className="text-sm text-slate-500">Contacting active detection providers and averaging scores</p>
      </div>

      {/* Main progress bar card */}
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-start space-x-3.5">
            <div className="bg-indigo-50 text-indigo-900 p-2.5 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base truncate" title={data.document.title}>
                {data.document.title}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Scan ID: {data.scan.id}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress gauge */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Overall Progress</span>
              <span>{progressPercent}% ({completedCount} / {totalJobs} complete)</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
              <div
                className="bg-indigo-900 h-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Warning notice */}
          {data.scan.status === 'FAILED' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 text-red-800">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-650" />
              <div>
                <h4 className="font-bold text-xs">Scan Job Blocked</h4>
                <p className="text-xs mt-0.5">
                  {data.scan.errorMessage || 'All provider engines failed to complete the text evaluation.'}
                </p>
              </div>
            </div>
          )}

          {/* Job details */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Individual Platform Status
            </span>

            <div className="space-y-2.5">
              {data.jobs.map((job) => (
                <div
                  key={job.id}
                  className={`flex items-center justify-between p-3.5 border rounded-lg transition-colors bg-white ${
                    job.status === 'COMPLETED' ? 'border-slate-200' :
                    job.status === 'FAILED' ? 'border-red-200 bg-red-50/10' :
                    job.status === 'PROCESSING' ? 'border-indigo-200 bg-indigo-50/10' :
                    'border-slate-100 bg-slate-550/20'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    {getJobStatusIcon(job.status)}
                    <div>
                      <span className="text-sm font-semibold text-slate-900">{job.providerName}</span>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        {getJobStatusText(job.status)}
                        {job.durationMs && (
                          <>
                            <span className="text-slate-300 text-[10px]">•</span>
                            <span className="text-[10px] text-slate-400">{(job.durationMs / 1000).toFixed(1)}s response</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    {job.status === 'COMPLETED' && job.score !== null ? (
                      <span className="text-sm font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {Math.round(job.score)}% Risk
                      </span>
                    ) : job.status === 'FAILED' ? (
                      <span className="text-[10px] text-red-600 max-w-[150px] truncate block" title={job.errorMessage || 'Scan failed'}>
                        {job.errorMessage || 'Error'}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>

        {isFinished && (
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
            {data.scan.status === 'COMPLETED' ? (
              <Button
                onClick={() => router.push(`/reports/${data.scan.id}`)}
                className="flex items-center space-x-1.5 cursor-pointer shadow-md"
              >
                <span>View Detailed Report</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="outline" onClick={() => router.push('/admin/upload')}>
                Return to Upload
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
