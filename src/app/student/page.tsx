'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import {
  UploadCloud,
  FileText,
  FileCheck,
  AlertTriangle,
  History,
  CheckSquare,
  Square,
  HelpCircle,
} from 'lucide-react';

interface AllowedProvider {
  id: string;
  key: string;
  name: string;
  isMockMode: boolean;
}

interface ScanHistoryItem {
  id: string;
  combinedScore: number | null;
  status: string;
  createdAt: string;
  document: {
    title: string;
    fileType: string;
    fileSize: number;
  };
  jobs: {
    providerKey: string;
    status: string;
    score: number | null;
  }[];
}

export default function StudentDashboard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // States
  const [providers, setProviders] = useState<AllowedProvider[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<Record<string, boolean>>({});
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [providersRes, scansRes] = await Promise.all([
        fetch('/api/student/providers'),
        fetch('/api/student/scans'),
      ]);

      if (providersRes.ok && scansRes.ok) {
        const providersData = await providersRes.json();
        const scansData = await scansRes.json();
        
        setProviders(providersData.providers);
        setScans(scansData.scans);
        
        // Auto-select all available providers initially
        const preselected: Record<string, boolean> = {};
        providersData.providers.forEach((p: AllowedProvider) => {
          preselected[p.key] = true;
        });
        setSelectedProviders(preselected);
      }
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setUploadError('');

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['pdf', 'docx', 'txt'];
    
    if (!ext || !validExtensions.includes(ext)) {
      setUploadError('Invalid file type. Only PDF, DOCX, and TXT documents are allowed.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleProviderToggle = (key: string) => {
    setSelectedProviders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUploadAndScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');

    if (!selectedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    const activeSelectedKeys = Object.keys(selectedProviders).filter((k) => selectedProviders[k]);
    if (activeSelectedKeys.length === 0) {
      setUploadError('Please select at least one AI-detection platform to check against.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('providers', JSON.stringify(activeSelectedKeys));

    try {
      const res = await fetch('/api/student/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect to real-time progress page
        router.push(`/student/scan/${data.scanId}`);
      } else {
        setUploadError(data.error || 'Failed to initialize document scan.');
        setIsUploading(false);
      }
    } catch (err) {
      setUploadError('An error occurred during file upload.');
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-slate-100 text-slate-600';
    if (score < 20) return 'bg-emerald-50 text-emerald-705 border-emerald-200';
    if (score < 50) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getStatusLabel = (item: ScanHistoryItem) => {
    switch (item.status) {
      case 'COMPLETED':
        return item.combinedScore !== null ? (
          <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-lg border ${getScoreColor(item.combinedScore)}`}>
            {Math.round(item.combinedScore)}%
          </span>
        ) : (
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-150 text-slate-700">Ready</span>
        );
      case 'PROCESSING':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">Scanning</span>;
      case 'PENDING':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-500 border border-slate-200">Pending</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-50 text-red-700 border border-red-200">Failed</span>;
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
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Document Scan Center</h2>
        <p className="text-sm text-slate-500">Upload written documents to evaluate potential AI generation risk</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
            <CardDescription>Drag and drop or select your document. PDF, DOCX, and TXT files accepted.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <form onSubmit={handleUploadAndScan} className="space-y-6">
              {uploadError && (
                <div className="p-3 bg-red-55/60 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                  {uploadError}
                </div>
              )}

              {/* Drag Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-indigo-900 bg-indigo-50/30 scale-[0.99] shadow-inner'
                    : selectedFile
                    ? 'border-emerald-500 bg-emerald-50/10'
                    : 'border-slate-300 hover:border-slate-450 hover:bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                
                {selectedFile ? (
                  <>
                    <div className="bg-emerald-100 text-emerald-950 p-3 rounded-full mb-3 shadow-sm">
                      <FileCheck className="h-6.5 w-6.5" />
                    </div>
                    <span className="font-semibold text-slate-850 block max-w-sm truncate" title={selectedFile.name}>
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      {formatFileSize(selectedFile.size)} • Change file
                    </span>
                  </>
                ) : (
                  <>
                    <div className="bg-indigo-50 text-indigo-900 p-3.5 rounded-full mb-3 shadow-sm">
                      <UploadCloud className="h-6.5 w-6.5" />
                    </div>
                    <span className="font-bold text-sm text-slate-750 block">
                      Drag & Drop Document Here
                    </span>
                    <span className="text-xs text-slate-400 mt-1.5 leading-normal max-w-xs">
                      Or click to browse files from your computer. Maximum size allowed: 10MB.
                    </span>
                  </>
                )}
              </div>

              {/* Allowed Providers checklist */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Select AI-Detection Platforms
                </span>

                {providers.length === 0 ? (
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-100 text-amber-850 text-xs flex items-start space-x-2 leading-relaxed">
                    <AlertTriangle className="h-4.5 w-4.5 text-amber-600 mt-0.5 shrink-0" />
                    <p>
                      <strong>No active detectors available.</strong> You must be assigned at least one active, enabled provider before running a scan. Please contact your administrator.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {providers.map((p) => {
                      const isSelected = !!selectedProviders[p.key];
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleProviderToggle(p.key)}
                          className={`flex items-center justify-between p-3.5 border rounded-lg cursor-pointer select-none transition-all ${
                            isSelected
                              ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 font-medium'
                              : 'border-slate-200 text-slate-550 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {isSelected ? (
                              <CheckSquare className="h-4.5 w-4.5 text-indigo-900" />
                            ) : (
                              <Square className="h-4.5 w-4.5 text-slate-350" />
                            )}
                            <span className="text-sm">{p.name}</span>
                          </div>
                          {p.isMockMode && (
                            <span className="text-[9px] font-bold bg-slate-100 text-slate-450 rounded px-1.5 py-0.2 border border-slate-200">
                              Simulated
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end border-t border-slate-100 pt-5">
                <Button
                  type="submit"
                  disabled={providers.length === 0 || !selectedFile}
                  isLoading={isUploading}
                  className="px-8 py-2.5 font-semibold text-sm cursor-pointer shadow-md"
                >
                  Scan Document
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Informational Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle>Academic Advisor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-slate-650 leading-relaxed">
            <div className="p-3.5 bg-indigo-50 text-indigo-900 border border-indigo-150 rounded-lg flex items-start space-x-2.5">
              <HelpCircle className="h-5 w-5 shrink-0 mt-0.5 text-indigo-900" />
              <div className="space-y-1">
                <h4 className="font-bold text-xs">How do scans work?</h4>
                <p>
                  We compile scores from multiple industry-standard AI detection platforms enabled by your instructor. We then calculate a combined average score.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Important Guideline</h4>
              <p>
                AI-detector results represent statistical <strong>AI-risk indicators</strong>. They estimate the probability of machine generation but are not guaranteed proof. Always check flagged paragraphs and verify references manually.
              </p>
            </div>
            
            <div className="border-t border-slate-150 pt-3 space-y-1.5">
              <h4 className="font-bold text-slate-850">Supported File Types:</h4>
              <ul className="list-disc pl-4 space-y-1">
                <li>PDF (.pdf) - Scans text elements</li>
                <li>Word (.docx) - Extracts raw document text</li>
                <li>Plain Text (.txt) - Directly uploads contents</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Log */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <History className="h-5 w-5 text-indigo-900" />
              <span>Your Review History</span>
            </CardTitle>
            <CardDescription>Previous scans and downloadable reports</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {scans.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              You haven't uploaded any documents for scanning yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Checked Platforms</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead className="text-center">AI Risk</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scans.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-semibold text-slate-900 max-w-sm truncate" title={item.document.title}>
                        {item.document.title}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {item.document.fileType.toUpperCase()} • {formatFileSize(item.document.fileSize)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-600 font-medium">
                        {item.jobs.map((j) => j.providerKey.toUpperCase()).join(', ')}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-medium">
                      {new Date(item.createdAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </TableCell>
                    <TableCell className="text-center">{getStatusLabel(item)}</TableCell>
                    <TableCell className="text-right">
                      {item.status === 'COMPLETED' ? (
                        <Link
                          href={`/reports/${item.id}`}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
                        >
                          <FileCheck className="h-4.5 w-4.5" />
                          <span>View Report</span>
                        </Link>
                      ) : item.status === 'PROCESSING' || item.status === 'PENDING' ? (
                        <Link
                          href={`/student/scan/${item.id}`}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-lg text-xs font-semibold border border-indigo-150 transition-colors animate-pulse"
                        >
                          <span>Track Scan</span>
                        </Link>
                      ) : (
                        <span className="text-xs text-red-650 font-semibold italic">Failed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
