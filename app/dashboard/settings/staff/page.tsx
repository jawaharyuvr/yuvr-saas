'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Users, UserPlus, Trash2, Shield, Mail, CheckCircle2, Clock } from 'lucide-react';
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
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'staff' | 'viewer'>('staff');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
    else fetchStaff();
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Find user by email in profiles
      const { data: targetProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail.toLowerCase())
        .single();

      if (profileError || !targetProfile) {
        throw new Error(t('staff.userNotFound') || `User not found. They must have a ${t('common.brandName')} account first.`);
      }

      // 2. Add as staff
      const { error: inviteError } = await supabase
        .from('staff')
        .insert({
          business_id: user.id,
          user_id: targetProfile.id,
          role: inviteRole
        });

      if (inviteError) {
        if (inviteError.code === '23505') throw new Error(t('staff.alreadyStaff') || 'User is already a staff member.');
        throw inviteError;
      }

      alert(t('staff.addSuccess') || 'Staff member added successfully!');
      setInviteEmail('');
      setIsInviteModalOpen(false);
      fetchStaff();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setInviting(false);
    }
  };

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
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">{t('staff.loading')}</td></tr>
              ) : staff.length > 0 ? (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900">{member.profiles?.full_name || 'Anonymous User'}</span>
                        <span className="text-xs text-slate-500">{member.profiles?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-600">
                        {member.role}
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

      {/* Add Staff Modal (Simplified for this task) */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">{t('staff.addStaff')}</h3>
                <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              
              <form onSubmit={handleAddStaff} className="space-y-4">
                <Input 
                  label={t('staff.userEmail')} 
                  type="email" 
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">{t('staff.role')}</label>
                  <select 
                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                  >
                    <option value="staff">{t('staff.staffRole')}</option>
                    <option value="admin">{t('staff.adminRole')}</option>
                    <option value="viewer">{t('staff.viewerRole')}</option>
                  </select>
                </div>
                <div className="pt-2 flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setIsInviteModalOpen(false)}>{t('common.cancel')}</Button>
                  <Button type="submit" className="flex-1" isLoading={inviting}>{t('staff.addUser')}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
