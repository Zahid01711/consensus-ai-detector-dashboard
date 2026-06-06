'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import {
  Download,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Calendar,
  User,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface JobResult {
  id: string;
  providerKey: string;
  providerName: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  score: number | null;
  errorMessage: string | null;
  durationMs: number | null;
}

interface ScanReport {
  scan: {
    id: string;
    combinedScore: number | null;
    status: string;
    errorMessage: string | null;
    createdAt: string;
    updatedAt: string;
  };
  document: {
    id: string;
    title: string;
    fileType: string;
    fileSize: number;
    contentText: string;
  };
  jobs: JobResult[];
  student: {
    name: string;
    email: string;
  };
}

export default function ReportDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);

  useEffect(() => {
    // 1. Fetch current user session role for navigation back button
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/student/scan/${id}`);
        if (!res.ok) {
          if (res.status === 403) {
            setError('Access Denied. You do not have permission to view this report.');
          } else {
            setError('Failed to load report details.');
          }
          return;
        }

        const data: ScanReport = await res.json();
        setReport(data);
      } catch (err) {
        console.error(err);
        setError('Connection error occurred.');
      }
    };
    fetchReport();
  }, [id]);

  const handleExportPDF = () => {
    if (!report) return;

    try {
      const doc = new jsPDF() as any;
      const combinedScoreText = report.scan.combinedScore !== null ? `${Math.round(report.scan.combinedScore)}%` : 'N/A';
      const scanDate = new Date(report.scan.createdAt).toLocaleString();
      const statusText = report.scan.status;

      // Primary colors: Navy Blue theme
      const navy = [15, 23, 42]; // #0f172a
      const indigo = [49, 46, 129]; // #312e81
      
      // Page 1 Header
      doc.setFillColor(...navy);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('MULTI-DETECTOR AI REVIEW REPORT', 15, 18);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('ACADEMIC CONSOLIDATED AI RISK ASSESSMENT', 15, 26);
      
      // Combined Score Panel (drawn as card)
      doc.setFillColor(248, 250, 252); // bg-slate-50
      doc.rect(15, 48, 180, 42, 'F');
      doc.setDrawColor(226, 232, 240); // border-slate-200
      doc.rect(15, 48, 180, 42, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...indigo);
      doc.text('CONSOLIDATED AI RISK INDICATOR', 22, 58);

      doc.setFontSize(36);
      doc.setTextColor(30, 27, 75); // deep indigo
      doc.text(combinedScoreText, 22, 80);

      // Metas in Panel
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`File Name: ${report.document.title}`, 85, 58);
      doc.text(`Reviewer: ${report.student.name} (${report.student.email})`, 85, 65);
      doc.text(`Scan Date: ${scanDate}`, 85, 72);
      doc.text(`Overall Status: ${statusText}`, 85, 79);

      // Warning text
      doc.setFillColor(254, 243, 199); // bg-amber-100
      doc.rect(15, 96, 180, 15, 'F');
      doc.setDrawColor(251, 191, 36); // border-amber-400
      doc.rect(15, 96, 180, 15, 'D');
      doc.setTextColor(146, 64, 14); // amber-800
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text('IMPORTANT GUIDELINE:', 20, 102);
      doc.setFont('helvetica', 'normal');
      doc.text('This score represents statistical AI risk. It serves as an indicator, not guaranteed proof.', 20, 107);

      // Table of provider scores
      doc.setTextColor(...navy);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('INDIVIDUAL DETECTOR METRICS', 15, 122);

      const tableRows = report.jobs.map((job) => [
        job.providerName,
        job.status,
        job.score !== null ? `${Math.round(job.score)}%` : '—',
        job.durationMs ? `${(job.durationMs / 1000).toFixed(1)}s` : '—',
        job.errorMessage || 'None',
      ]);

      doc.autoTable({
        startY: 126,
        head: [['Platform', 'Status', 'AI Score', 'Response Time', 'Warnings / Errors']],
        body: tableRows,
        theme: 'striped',
        headStyles: {
          fillColor: indigo,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8.5,
        },
      });

      // Extracted Text section
      const finalY = doc.lastAutoTable.finalY + 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('EXTRACTED DOCUMENT TEXT PREVIEW (FIRST 2000 CHARS)', 15, finalY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105); // slate-600

      const textSnippet = report.document.contentText.substring(0, 2000) + 
        (report.document.contentText.length > 2000 ? '\n\n[Content truncated in PDF summary. Read full text on the review website.]' : '');
      
      const splitText = doc.splitTextToSize(textSnippet, 180);
      doc.text(splitText, 15, finalY + 6);

      // Save PDF file
      doc.save(`AI_Review_Report_${report.document.title.replace(/\s+/g, '_')}.pdf`);
    } catch (pdfError) {
      console.error('PDF Generation Failed:', pdfError);
      alert('Failed to export PDF report. Please try again.');
    }
  };

  // On dark background (report header): vivid solid colors
  const getScoreColorDark = (score: number | null) => {
    if (score === null) return 'bg-slate-600 text-slate-100 border-slate-500';
    if (score < 20) return 'bg-emerald-500 text-white border-emerald-400';
    if (score < 50) return 'bg-amber-400 text-amber-950 border-amber-300';
    return 'bg-red-500 text-white border-red-400';
  };

  // On light background (cards): subtle tinted colors
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-slate-100 text-slate-700 border-slate-200';
    if (score < 20) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (score < 50) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getScoreText = (score: number | null) => {
    if (score === null) return 'No evaluation';
    if (score < 20) return 'Low AI Risk';
    if (score < 50) return 'Moderate AI Risk';
    return 'High AI Risk';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

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
            <Button onClick={() => router.push('/')}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-900" />
        <span className="text-sm text-slate-500 font-medium">Assembling report details...</span>
      </div>
    );
  }

  const completedJobs = report.jobs.filter((j) => j.status === 'COMPLETED');
  // Only show limited confidence warning if fewer than 2 providers SUCCEEDED across 2+ that were attempted
  const attemptedJobs = report.jobs.length;
  const limitedConfidence = attemptedJobs >= 2 && completedJobs.length < 2;

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      {/* Back & Export Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(currentUser?.role === 'ADMIN' ? '/admin' : '/student')}
          className="inline-flex items-center space-x-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 px-3.5 py-1.5 bg-white rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>

        <Button onClick={handleExportPDF} className="flex items-center space-x-1.5 cursor-pointer shadow-sm">
          <Download className="h-4 w-4" />
          <span>Download PDF Report</span>
        </Button>
      </div>

      {/* Document Meta & Stats */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between space-y-6 md:space-y-0">
        <div className="space-y-3">
          <span className="px-2.5 py-1 bg-indigo-950 text-indigo-305 text-[10px] font-bold tracking-widest rounded-lg border border-indigo-900 uppercase">
            Official Scan Report
          </span>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-tight break-all max-w-xl">
            {report.document.title}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
            <span className="flex items-center space-x-1.5">
              <User className="h-3.5 w-3.5" />
              <span>Reviewer: <strong>{report.student.name}</strong></span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center space-x-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Scanned on: {new Date(report.scan.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center space-x-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span className="uppercase">{report.document.fileType} • {formatFileSize(report.document.fileSize)}</span>
            </span>
          </div>
        </div>

        {/* Big Combined Score Display */}
        <div className="bg-slate-950/40 border border-slate-700 rounded-xl p-5 w-full md:w-56 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Consolidated Score</span>
          <div className="mt-2 text-4xl font-extrabold tracking-tight text-white">
            {report.scan.combinedScore !== null ? `${Math.round(report.scan.combinedScore)}%` : '—'}
          </div>
          <span className={`mt-2.5 px-3 py-1 text-xs font-bold rounded-full border uppercase ${getScoreColorDark(report.scan.combinedScore)}`}>
            {getScoreText(report.scan.combinedScore)}
          </span>
        </div>
      </div>

      {/* Warnings & Limits alerts */}
      <div className="space-y-4">
        {limitedConfidence && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 text-amber-800">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <h4 className="font-bold text-xs">Limited confidence</h4>
              <p className="text-xs mt-0.5">
                Fewer than two detector results were available. The average is derived from a single active platform scan and may lack verification comparison.
              </p>
            </div>
          </div>
        )}

        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start space-x-3 text-indigo-900">
          <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5 text-indigo-900" />
          <div>
            <h4 className="font-bold text-xs">Academic Integrity Disclaimer</h4>
            <p className="text-xs mt-0.5 leading-normal">
              AI-detector scores represent statistical probability metrics (AI-risk indicators), not absolute or guaranteed proof of academic dishonesty. Results should be reviewed in context alongside student drafts and reference verification.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Provider scores and document preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Provider Cards Column */}
        <div className="lg:col-span-1 space-y-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
            Detector Details
          </span>

          {report.jobs.map((job) => (
            <Card key={job.id} className="shadow-sm">
              <CardContent className="p-4.5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-sm font-bold text-slate-905">{job.providerName}</span>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                    {job.status === 'COMPLETED' ? (
                      <span className="text-emerald-600 font-semibold flex items-center">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Scan Success
                      </span>
                    ) : (
                      <span className="text-red-650 font-semibold flex items-center">
                        <XCircle className="h-3 w-3 mr-1" /> Failed / Error
                      </span>
                    )}
                    {job.durationMs && (
                      <>
                        <span>•</span>
                        <span>{(job.durationMs / 1000).toFixed(1)}s</span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  {job.status === 'COMPLETED' && job.score !== null ? (
                    <div className={`px-2.5 py-1 text-sm font-bold rounded-lg border ${getScoreColor(job.score)}`}>
                      {Math.round(job.score)}%
                    </div>
                  ) : (
                    <div className="text-xs text-red-600 font-semibold max-w-[100px] truncate" title={job.errorMessage || 'Failed'}>
                      {job.errorMessage || 'Scan failed'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Extracted Text Preview Column */}
        <div className="lg:col-span-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
            Extracted Document Text
          </span>

          <Card className="h-[460px] flex flex-col overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-4.5">
              <CardTitle className="text-sm font-bold">Document Content Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 overflow-y-auto font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
              {report.document.contentText}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
