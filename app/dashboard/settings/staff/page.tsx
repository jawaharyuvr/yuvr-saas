'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Users, UserPlus, Trash2, Shield, Mail, CheckCircle2, Lock, User as UserIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from '@/contexts/LanguageContext';

interface StaffMember {
  id: string;
  user_id: string;
  role: 'admin' | 'staff' | 'viewer';
  status: string;
  profiles?: {
    full_name: string;
    email: string;
    username: string;
  };
}

export default function StaffManagementPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [activeUserRole, setActiveUserRole] = useState<string>('');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'staff' | 'viewer'>('staff');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    checkAdminRoleAndFetchStaff();
  }, []);

  const checkAdminRoleAndFetchStaff = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: staffRec } = await supabase
        .from('staff')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      const role = staffRec?.role || 'admin'; // fallback to admin for primary owner
      setActiveUserRole(role);

      if (role === 'admin') {
        const { data, error } = await supabase
          .from('staff')
          .select(`
            *,
            profiles!user_id (
              full_name,
              email,
              username
            )
          `)
          .eq('business_id', user.id);

        if (error) {
          if (error.code === '42P01') {
            throw new Error('Database table "staff" not found. Please run the migration script in your Supabase SQL Editor.');
          }
          throw error;
        }
        setStaff(data || []);
      }
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStaff = async (id: string) => {
    if (!confirm(t('staff.removeConfirm') || 'Are you sure you want to remove this staff member?')) return;
    
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id);

    if (error) alert(error.message);
    else checkAdminRoleAndFetchStaff();
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !invitePassword || !inviteUsername) {
       return alert('Please fill strictly all Username, Email, and Password fields.');
    }

    setInviting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch('/api/v1/staff/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: inviteEmail,
          username: inviteUsername,
          password: invitePassword,
          role: inviteRole
        })
      });

      const response = await res.json();
      if (!res.ok) {
         throw new Error(response.error || 'Failed to provision staff member.');
      }

      alert(t('staff.addSuccess') || 'Staff member provisioned successfully!');
      setInviteEmail('');
      setInviteUsername('');
      setInvitePassword('');
      setIsInviteModalOpen(false);
      checkAdminRoleAndFetchStaff();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
     return <div className="p-12 text-center text-slate-500">{t('common.loading')}</div>;
  }

  if (activeUserRole !== 'admin') {
     return (
       <div className="flex flex-col items-center justify-center p-24 text-center">
          <Shield size={64} className="text-rose-500 mb-6" />
          <h1 className="text-3xl font-black text-slate-900 mb-2">Access Restricted</h1>
          <p className="text-slate-500 max-w-sm">This module requires strictly elevated Administrative privileges to securely manage team configurations.</p>
       </div>
     );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('staff.title')}</h1>
          <p className="text-slate-500 text-sm">{t('staff.subtitle')}</p>
        </div>
        <Button onClick={() => setIsInviteModalOpen(true)} className="flex items-center gap-2">
          <UserPlus size={18} />
          {t('staff.addStaff')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">{t('staff.nameEmail')}</th>
                <th className="px-6 py-4 font-medium">{t('staff.role')}</th>
                <th className="px-6 py-4 font-medium">{t('staff.status')}</th>
                <th className="px-6 py-4 font-medium text-right">{t('staff.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.length > 0 ? (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900">{member.profiles?.username || member.profiles?.full_name || 'Staff User'}</span>
                        <span className="text-xs text-slate-500">{member.profiles?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-600">
                        {member.role === 'staff' ? 'Manage DB' : member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle2 size={14} />
                        <span className="text-xs font-medium">{t('staff.active')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleRemoveStaff(member.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <Users size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="font-medium text-slate-900">{t('staff.noStaff')}</p>
                    <p className="text-sm mt-1">{t('staff.noStaffDesc')}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl relative">
            <CardContent className="p-6 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 bg-indigo-50/50 rounded-bl-full -z-10" />
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Provision Staff Account</h3>
                <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center font-bold">✕</button>
              </div>
              
              <form onSubmit={handleAddStaff} className="space-y-4">
                <Input 
                  label="Assigned Username"
                  type="text" 
                  placeholder="e.g. jsmith2026"
                  icon={<UserIcon size={16} />}
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  required
                />
                <Input 
                  label={t('staff.userEmail')} 
                  type="email" 
                  icon={<Mail size={16} />}
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
                <Input 
                  label="Generic Startup Password"
                  type="password" 
                  icon={<Lock size={16} />}
                  placeholder="••••••••"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  required
                />
                
                <div className="space-y-1.5 pt-2">
                  <label className="text-sm font-medium text-slate-700">{t('staff.role')}</label>
                  <select 
                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                  >
                    <option value="staff">Staff (Can Manage Invoices/Clients Only)</option>
                    <option value="admin">Administrator (Full Access)</option>
                    <option value="viewer">Viewer (Read-Only)</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setIsInviteModalOpen(false)} type="button">{t('common.cancel')}</Button>
                  <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200" isLoading={inviting}>Create Account</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
