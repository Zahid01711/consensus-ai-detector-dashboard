'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ShieldAlert, HelpCircle, Save, Database, Trash2 } from 'lucide-react';

export default function SystemSettingsView() {
  const [retentionDays, setRetentionDays] = useState('30');
  const [fileLimitMb, setFileLimitMb] = useState('10');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setRetentionDays(String(data.settings.retentionDays));
            setFileLimitMb(String(data.settings.fileLimitMb));
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const rDays = parseInt(retentionDays, 10);
    const fLimit = parseInt(fileLimitMb, 10);

    if (isNaN(rDays) || rDays < 1) {
      setMessage({ type: 'error', text: 'Retention period must be at least 1 day.' });
      setIsSaving(false);
      return;
    }

    if (isNaN(fLimit) || fLimit < 1 || fLimit > 100) {
      setMessage({ type: 'error', text: 'File limit must be between 1MB and 100MB.' });
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retentionDays: rDays,
          fileLimitMb: fLimit,
          weightsJson: '{}', // Default equal weights
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'System settings saved successfully!' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to save settings.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'API error occurred.' });
    } finally {
      setIsSaving(false);
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
      <div>
        <h2 className="text-2xl font-bold text-slate-900">System Configuration</h2>
        <p className="text-sm text-slate-500">Configure global parameters, file upload limits, and document storage policies</p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSave}>
          <Card>
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2.5">
                <Database className="h-5 w-5 text-indigo-900" />
                <CardTitle>Global Limits & Retention</CardTitle>
              </div>
              <CardDescription>
                These controls apply system-wide to all student accounts and document uploads.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {message && (
                <div className={`p-4 rounded-lg border text-xs font-semibold ${
                  message.type === 'success' ? 'bg-emerald-50 border-emerald-250 text-emerald-805' : 'bg-red-50 border-red-250 text-red-750'
                }`}>
                  {message.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="File Upload Limit (MB)"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="10"
                    value={fileLimitMb}
                    onChange={(e) => setFileLimitMb(e.target.value)}
                    required
                  />
                  <p className="mt-1.5 text-[11px] text-slate-400 leading-normal flex items-start space-x-1">
                    <HelpCircle className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>Maximum allowable size for uploaded files. Applies to PDF, DOCX, and TXT files. Recommendation: 10MB.</span>
                  </p>
                </div>

                <div>
                  <Input
                    label="Data Retention Period (Days)"
                    type="number"
                    min="1"
                    placeholder="30"
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(e.target.value)}
                    required
                  />
                  <p className="mt-1.5 text-[11px] text-slate-400 leading-normal flex items-start space-x-1">
                    <HelpCircle className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>Number of days before scans, extracted text, and results are deleted automatically to protect student privacy.</span>
                  </p>
                </div>
              </div>

              <div className="bg-slate-100/60 p-4 rounded-lg border border-slate-200 flex items-start space-x-3">
                <ShieldAlert className="h-5 w-5 text-indigo-900 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Privacy and Storage Compliance</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Setting a lower retention period (e.g. 14 or 30 days) is highly recommended in academic environments. Student text content and reports are stored securely in the local PostgreSQL database and are only accessible by instructors and the uploading student.
                  </p>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="bg-slate-50/50 p-6 flex justify-end">
              <Button type="submit" isLoading={isSaving} className="flex items-center space-x-1.5 cursor-pointer">
                <Save className="h-4 w-4" />
                <span>Save Settings</span>
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </>
  );
}
