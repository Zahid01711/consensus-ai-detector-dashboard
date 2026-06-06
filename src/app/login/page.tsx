'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FileSpreadsheet, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid credentials. Please try again.');
        setIsLoading(false);
        return;
      }

      // Refresh page and redirect via root page logic or manual router push
      router.refresh();
      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/student');
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred. Please try again later.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* App Branding */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-indigo-900 text-white p-3.5 rounded-2xl shadow-md mb-3">
            <FileSpreadsheet className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-indigo-950 tracking-tight leading-none">
            AI Multi-Review
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1.5">
            Academic AI-Detector Consolidated Dashboard
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in with your academic reviewer credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-55/60 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                  {error}
                </div>
              )}
              
              <div className="relative">
                <Mail className="absolute left-3.5 top-8.5 h-4 w-4 text-slate-400" />
                <Input
                  label="Academic Email"
                  type="email"
                  placeholder="name@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-8.5 h-4 w-4 text-slate-400" />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-2 py-2.5 text-sm font-semibold tracking-wide"
                isLoading={isLoading}
              >
                Sign In to Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Informative Footer */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-slate-400 leading-normal max-w-sm mx-auto">
            <strong>Disclaimer:</strong> AI detection systems provide indicators of generated content based on statistical models. Results represent an <strong>AI-risk indicator</strong> and should never be used as final or guaranteed proof of academic dishonesty.
          </p>
        </div>
      </div>
    </main>
  );
}
