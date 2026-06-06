'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  UserPlus,
  Key,
  Trash2,
  Lock,
  Mail,
  User,
  ShieldCheck,
  X,
  AlertTriangle,
} from 'lucide-react';

interface Permission {
  providerId: string;
  provider: {
    key: string;
    name: string;
  };
}

interface Student {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  permissions: Permission[];
}

interface ProviderItem {
  id: string;
  key: string;
  name: string;
  isEnabled: boolean;
}

export default function StudentsManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal control states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPermsOpen, setIsPermsOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form states
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Permissions edit checklist states
  const [permsChecked, setPermsChecked] = useState<Record<string, boolean>>({});
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  const loadData = async () => {
    try {
      const [studentsRes, providersRes] = await Promise.all([
        fetch('/api/admin/students'),
        fetch('/api/admin/providers'),
      ]);

      if (studentsRes.ok && providersRes.ok) {
        const studentsData = await studentsRes.json();
        const providersData = await providersRes.json();
        setStudents(studentsData.students);
        setProviders(providersData.providers);
      }
    } catch (err) {
      console.error('Failed to load students data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setIsCreating(true);

    // Filter enabled providers to assign initially
    const defaultPermIds = providers.filter((p) => p.isEnabled).map((p) => p.id);

    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: newName,
          email: newEmail,
          password: newPassword,
          providerIds: defaultPermIds,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsCreateOpen(false);
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        loadData();
      } else {
        setCreateError(data.error || 'Failed to create student account.');
      }
    } catch (err) {
      setCreateError('API error occurred.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenPermissions = (student: Student) => {
    setSelectedStudent(student);
    
    // Build checked state map
    const checkedMap: Record<string, boolean> = {};
    student.permissions.forEach((p) => {
      checkedMap[p.providerId] = true;
    });
    setPermsChecked(checkedMap);
    setIsPermsOpen(true);
  };

  const handleCheckboxChange = (providerId: string, checked: boolean) => {
    setPermsChecked((prev) => ({ ...prev, [providerId]: checked }));
  };

  const handleSavePermissions = async () => {
    if (!selectedStudent) return;
    setIsSavingPerms(true);

    const providerIds = Object.keys(permsChecked).filter((id) => permsChecked[id]);

    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_permissions',
          id: selectedStudent.id,
          providerIds,
        }),
      });

      if (res.ok) {
        setIsPermsOpen(false);
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingPerms(false);
    }
  };

  const handleDeleteStudent = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to permanently delete the reviewer account for ${email}?`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          id,
        }),
      });

      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
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
      {/* Title & Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Student Reviewer Accounts</h2>
          <p className="text-sm text-slate-500">Create login credentials and manage provider scanning permissions</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center space-x-1.5 cursor-pointer">
          <UserPlus className="h-4 w-4" />
          <span>Add Student Account</span>
        </Button>
      </div>

      {/* Main Student Card */}
      <Card>
        <CardContent className="p-0">
          {students.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              No student accounts have been created yet. Click "Add Student Account" to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Email Address</TableHead>
                  <TableHead>Allowed Detectors</TableHead>
                  <TableHead>Registered On</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-semibold text-slate-900">{student.name}</TableCell>
                    <TableCell className="font-medium text-slate-700">{student.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {student.permissions.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">None enabled</span>
                        ) : (
                          student.permissions.map((p) => (
                            <span
                              key={p.providerId}
                              className="px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-150"
                            >
                              {p.provider.name}
                            </span>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {new Date(student.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenPermissions(student)}
                        className="h-8 py-0"
                      >
                        <Key className="h-3.5 w-3.5 mr-1" />
                        Permissions
                      </Button>
                      <button
                        onClick={() => handleDeleteStudent(student.id, student.email)}
                        className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-red-650 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Delete Account"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* CREATE STUDENT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-indigo-900" />
                <span>Create Student Account</span>
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateStudent}>
              <div className="p-6 space-y-4">
                {createError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                    {createError}
                  </div>
                )}

                <div className="relative">
                  <User className="absolute left-3.5 top-8.5 h-4 w-4 text-slate-400" />
                  <Input
                    label="Full Name"
                    placeholder="Alice Student"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3.5 top-8.5 h-4 w-4 text-slate-400" />
                  <Input
                    label="Academic Email"
                    type="email"
                    placeholder="student@school.edu"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-8.5 h-4 w-4 text-slate-400" />
                  <Input
                    label="Password"
                    type="text"
                    placeholder="Enter secure password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-20"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="absolute right-2.5 top-7.5 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold transition-colors border border-slate-300 cursor-pointer"
                  >
                    Generate
                  </button>
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-start space-x-2.5">
                  <ShieldCheck className="h-4.5 w-4.5 text-indigo-900 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-indigo-900 leading-normal font-medium">
                    New students will automatically receive scanning permissions for all currently <strong>enabled</strong> provider platforms. You can edit this list at any time.
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit" isLoading={isCreating}>
                  Create Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PERMISSIONS MODAL */}
      {isPermsOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                <Key className="h-5 w-5 text-indigo-900" />
                <span>Provider Permissions</span>
              </h3>
              <button onClick={() => setIsPermsOpen(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">{selectedStudent.name}</p>
                <p className="text-xs text-slate-400">{selectedStudent.email}</p>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
                  Assign Allowed Providers
                </span>
                
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {providers.map((prov) => {
                    const isChecked = !!permsChecked[prov.id];
                    return (
                      <label
                        key={prov.id}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 font-medium'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        } ${!prov.isEnabled ? 'opacity-65' : ''}`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleCheckboxChange(prov.id, e.target.checked)}
                            className="rounded border-slate-350 text-indigo-900 focus:ring-indigo-900 h-4 w-4"
                          />
                          <span className="text-sm">{prov.name}</span>
                        </div>
                        {!prov.isEnabled && (
                          <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-100 rounded px-1.5 py-0.2 select-none border border-slate-200">
                            Offline
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start space-x-2.5">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-amber-800 leading-normal">
                  If a selected provider is marked <strong>Offline</strong>, it is globally disabled. Students won't see or use it until the system administrator enables it in Provider Settings.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
              <Button variant="outline" size="sm" onClick={() => setIsPermsOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSavePermissions} isLoading={isSavingPerms}>
                Save Permissions
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
