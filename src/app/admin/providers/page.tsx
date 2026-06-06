'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { AlertCircle, CheckCircle, HelpCircle, Key, ShieldAlert } from 'lucide-react';

interface Provider {
  id: string;
  key: string;
  name: string;
  isEnabled: boolean;
  isMockMode: boolean;
  isConfigured: boolean;
  hasAdditionalConfig: boolean;
}

export default function ProvidersSettings() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Card specific edit states
  const [keysInput, setKeysInput] = useState<Record<string, string>>({});
  const [emailsInput, setEmailsInput] = useState<Record<string, string>>({}); // For Copyleaks
  const [testingStatus, setTestingStatus] = useState<Record<string, { loading: boolean; success?: boolean; message?: string }>>({});
  const [savingStatus, setSavingStatus] = useState<Record<string, { loading: boolean; success?: boolean }>>({});

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/admin/providers');
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleToggleChange = (pKey: string, field: 'isEnabled' | 'isMockMode', val: boolean) => {
    setProviders((prev) =>
      prev.map((p) => (p.key === pKey ? { ...p, [field]: val } : p))
    );
  };

  const handleTestConnection = async (p: Provider) => {
    const pKey = p.key;
    setTestingStatus((prev) => ({ ...prev, [pKey]: { loading: true } }));

    const payload = {
      providerKey: p.key,
      apiKey: keysInput[pKey] || '',
      isMockMode: p.isMockMode,
      additionalConfig: p.key === 'copyleaks' ? JSON.stringify({ email: emailsInput[pKey] || '' }) : undefined,
    };

    try {
      const res = await fetch('/api/admin/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setTestingStatus((prev) => ({
        ...prev,
        [pKey]: { loading: false, success: data.success, message: data.message },
      }));
    } catch (err: any) {
      setTestingStatus((prev) => ({
        ...prev,
        [pKey]: { loading: false, success: false, message: 'API connection error.' },
      }));
    }
  };

  const handleSaveConfig = async (p: Provider) => {
    const pKey = p.key;
    setSavingStatus((prev) => ({ ...prev, [pKey]: { loading: true } }));

    const payload = {
      id: p.id,
      isEnabled: p.isEnabled,
      isMockMode: p.isMockMode,
      apiKey: keysInput[pKey] || undefined,
      additionalConfig: p.key === 'copyleaks' && emailsInput[pKey] ? JSON.stringify({ email: emailsInput[pKey] }) : undefined,
    };

    try {
      const res = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSavingStatus((prev) => ({ ...prev, [pKey]: { loading: false, success: true } }));
        setTimeout(() => {
          setSavingStatus((prev) => ({ ...prev, [pKey]: { loading: false } }));
        }, 3000);
        fetchProviders(); // Refresh list to get isConfigured
      } else {
        setSavingStatus((prev) => ({ ...prev, [pKey]: { loading: false, success: false } }));
      }
    } catch (err) {
      setSavingStatus((prev) => ({ ...prev, [pKey]: { loading: false, success: false } }));
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
        <h2 className="text-2xl font-bold text-slate-900">AI Detection Platforms</h2>
        <p className="text-sm text-slate-500">Configure credentials, enable providers, and manage demo settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {providers.map((p) => {
          const test = testingStatus[p.key];
          const save = savingStatus[p.key];
          const isPlaceholder = ['writer', 'crossplag', 'zerogpt'].includes(p.key);

          return (
            <Card key={p.id} className={`flex flex-col relative overflow-hidden ${isPlaceholder ? 'bg-slate-50 border-dashed border-slate-300' : ''}`}>
              {/* Highlight active status */}
              <div className={`absolute top-0 left-0 w-full h-1.5 ${p.isEnabled ? 'bg-indigo-900' : 'bg-slate-300'}`} />

              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-2 rounded-lg ${p.isEnabled ? 'bg-indigo-50 text-indigo-905' : 'bg-slate-100 text-slate-400'}`}>
                      <Key className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">{p.name}</CardTitle>
                      {isPlaceholder ? (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.2 mt-1 inline-block uppercase">
                          Manual Setup
                        </span>
                      ) : (
                        <CardDescription className="text-xs">
                          {p.isEnabled ? 'Scans active' : 'Scans offline'}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <div>
                    <Switch
                      checked={p.isEnabled}
                      onChange={(val) => handleToggleChange(p.key, 'isEnabled', val)}
                      disabled={isPlaceholder && !p.isMockMode} // Force placeholders to stay disabled if not mocking
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-4 pt-2">
                {/* Mock Mode Control */}
                <div className="bg-slate-100/60 p-3.5 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Simulator Mode</span>
                      <span className="text-[11px] text-slate-500">Run checks without using paid API credits</span>
                    </div>
                    <Switch
                      checked={p.isMockMode}
                      onChange={(val) => handleToggleChange(p.key, 'isMockMode', val)}
                    />
                  </div>
                </div>

                {/* API Key Form */}
                <div className="space-y-4">
                  {p.key === 'copyleaks' && (
                    <Input
                      label="Account Email (Copyleaks)"
                      placeholder={p.hasAdditionalConfig ? '••••••••' : 'account-email@school.edu'}
                      value={emailsInput[p.key] || ''}
                      onChange={(e) => setEmailsInput({ ...emailsInput, [p.key]: e.target.value })}
                      disabled={p.isMockMode}
                    />
                  )}

                  <Input
                    label="Provider API Key"
                    type="password"
                    placeholder={p.isConfigured ? '••••••••••••••••••••••••' : 'Enter API Key'}
                    value={keysInput[p.key] || ''}
                    onChange={(e) => setKeysInput({ ...keysInput, [p.key]: e.target.value })}
                    disabled={p.isMockMode}
                  />
                  
                  {p.isMockMode && (
                    <p className="text-[10px] text-slate-400 italic">
                      API credentials are disabled. Simulator runs locally with mock responses.
                    </p>
                  )}
                </div>

                {/* Test Status feedback */}
                {test && (
                  <div className={`p-3 rounded-lg border text-xs leading-relaxed flex items-start space-x-2 ${
                    test.loading ? 'bg-slate-50 border-slate-200 text-slate-600' :
                    test.success ? 'bg-emerald-50 border-emerald-150 text-emerald-800' :
                    'bg-red-50 border-red-150 text-red-800'
                  }`}>
                    {test.loading ? (
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-slate-600 shrink-0 mt-0.5" />
                    ) : test.success ? (
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    ) : (
                      <ShieldAlert className="h-4.5 w-4.5 text-red-650 shrink-0" />
                    )}
                    <span className="font-medium">{test.message || (test.loading ? 'Testing endpoint connectivity...' : '')}</span>
                  </div>
                )}
              </CardContent>

              <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestConnection(p)}
                  isLoading={test?.loading}
                >
                  Test Connection
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSaveConfig(p)}
                  isLoading={save?.loading}
                >
                  {save?.success ? 'Saved!' : 'Save Config'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
