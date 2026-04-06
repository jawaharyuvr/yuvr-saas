'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Plus,
  Users,
  Globe,
  Download, 
  Trash2,
  Mail,
  Send,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency, cn } from '@/utils/format';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CURRENCIES, convertAmount } from '@/utils/constants';
import { generateInvoicePDF } from '@/utils/pdf';
import { buildInvoiceData, fetchUserBranding, type UserBranding, type AssembledInvoice } from '@/utils/invoiceEngine';
import { formatDate } from '@/utils/format';
import { useTranslation } from '@/contexts/LanguageContext';
import { PageTransition } from '@/components/ui/PageTransition';
import { TiltCard } from '@/components/ui/TiltCard';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton';

// Dynamic imports for heavy components
const InvoicePreviewModal = dynamic(() => import('@/components/InvoicePreviewModal').then(mod => mod.InvoicePreviewModal), {
  loading: () => <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-center justify-center animate-pulse" />
});

const Modal = dynamic(() => import('@/components/ui/Modal').then(mod => mod.Modal));

import { getLiveRate, syncExchangeRates } from '@/utils/rateSync';

interface DashboardStats {
  totalInvoices: number;
  paidInvoicesAmount: number;
  unpaidInvoicesAmount: number;
  totalRevenue: number;
}

interface RecentInvoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  currency: string;
  exchange_rate?: number;
  status: string;
  due_date: string;
  clients: { name: string; email: string; address?: string } | null;
  tax_rate: number;
  created_at?: string;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<DashboardStats>({
    totalInvoices: 0,
    paidInvoicesAmount: 0,
    unpaidInvoicesAmount: 0,
    totalRevenue: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [topClients, setTopClients] = useState<any[]>([]);
  const [dashboardCurrency, setDashboardCurrency] = useState('USD');
  // Preview
  const [selectedInvoice, setSelectedInvoice] = useState<AssembledInvoice | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Branding (fetched once alongside dashboard data)
  const [userBranding, setUserBranding] = useState<UserBranding & { username?: string; full_name?: string } | null>(null);

  // Email
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailInvoiceNumber, setEmailInvoiceNumber] = useState('');
  const [emailTotal, setEmailTotal] = useState(0);
  const [emailCurrency, setEmailCurrency] = useState('USD');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [selectedEmailInvoiceId, setSelectedEmailInvoiceId] = useState<string | null>(null);

  // Username
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  useEffect(() => {
    // Initial sync of exchange rates
    syncExchangeRates();
    fetchDashboardData();
  }, [dashboardCurrency]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setUserBranding(profile);
        if (!profile.username) {
          setIsUsernameModalOpen(true);
        }
      }

      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('total_amount, currency, exchange_rate, status, invoice_number, id, due_date, tax_rate, created_at, clients(name, email, address)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (invError) throw invError;

      if (invoices) {
        // Fetch LIVE rates for target conversion
        const targetRate = await getLiveRate('USD', dashboardCurrency);

        const calculateEquivalence = (amount: number, fromCurr: string, storedRate?: number) => {
           let amountInUSD = 0;
           if (storedRate && Number(storedRate) > 0) {
             amountInUSD = amount / Number(storedRate);
           } else {
             amountInUSD = convertAmount(amount, fromCurr, 'USD');
           }
           return amountInUSD * targetRate;
        };

        const stats: DashboardStats = {
          totalInvoices: invoices.length,
          paidInvoicesAmount: invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + calculateEquivalence(Number(inv.total_amount) || 0, inv.currency || 'USD', inv.exchange_rate), 0),
          unpaidInvoicesAmount: invoices
            .filter(inv => inv.status === 'unpaid')
            .reduce((sum, inv) => sum + calculateEquivalence(Number(inv.total_amount) || 0, inv.currency || 'USD', inv.exchange_rate), 0),
          totalRevenue: invoices
            .reduce((sum, inv) => sum + calculateEquivalence(Number(inv.total_amount) || 0, inv.currency || 'USD', inv.exchange_rate), 0),
        };
        setStatsData(stats);
        setRecentInvoices(invoices.slice(0, 5) as any);
      }

      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, email')
        .eq('user_id', user.id)
        .limit(5);
      
      if (clients) {
        setTopClients(clients);
      }

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (id: string) => {
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'paid' })
      .eq('id', id);

    if (error) alert(error.message);
    else fetchDashboardData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('invoices.deleteConfirm') || 'Are you sure you want to delete this invoice?')) return;
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) alert(error.message);
    else fetchDashboardData();
  };

  const handlePreview = async (inv: RecentInvoice) => {
    setPreviewLoading(true);
    setIsPreviewOpen(true);
    setSelectedInvoice(null);
    const assembled = await buildInvoiceData(inv.id, userBranding);
    setSelectedInvoice(assembled);
    setPreviewLoading(false);
  };

  const handleDownload = async (inv: AssembledInvoice | RecentInvoice) => {
    let assembled: AssembledInvoice | null;
    if ('items' in inv && 'template' in inv) {
      assembled = inv as AssembledInvoice;
    } else {
      assembled = await buildInvoiceData((inv as RecentInvoice).id, userBranding);
    }
    if (!assembled) return;
    await generateInvoicePDF(assembled);
  };

  const handleOpenEmailModal = (inv: RecentInvoice) => {
    setSelectedEmailInvoiceId(inv.id);
    setEmailTo(inv.clients?.email || '');
    setEmailInvoiceNumber(inv.invoice_number);
    setEmailTotal(inv.total_amount);
    setEmailCurrency(inv.currency || 'USD');
    setEmailSent(false);
    setIsEmailModalOpen(true);
  };

  const sendEmail = async () => {
    if (!emailTo || !emailTo.includes('@')) return alert('Please enter a valid email address');
    if (!selectedEmailInvoiceId) return alert('No invoice selected');

    setEmailSending(true);
    try {
      const assembled = await buildInvoiceData(selectedEmailInvoiceId, userBranding);
      if (!assembled) throw new Error('Could not load invoice data');

      const pdfBase64 = await generateInvoicePDF(assembled, true);

      const res = await fetch('/api/v1/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          to: emailTo, 
          invoiceNumber: emailInvoiceNumber,
          pdfBase64,
          brandColor: userBranding?.brand_color,
          companyName: userBranding?.company_name,
          totalAmount: emailTotal,
          currency: emailCurrency,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send email');
      setEmailSent(true);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setEmailSending(false);
    }
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    
    setIsSavingUsername(true);
    setUsernameError(null);

    try {
      const { data: existsData, error: checkError } = await supabase
        .rpc('check_user_exists', { 
          p_username: newUsername.toLowerCase(), 
          p_email: ''
        });

      if (checkError) throw new Error('Error validating username.');
      if (existsData?.usernameExists) {
        setUsernameError('This username is already taken.');
        setIsSavingUsername(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User session not found.');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username: newUsername.toLowerCase() })
        .eq('id', user.id);

      if (updateError) throw updateError;
      setIsUsernameModalOpen(false);
      setUserBranding(prev => prev ? { ...prev, username: newUsername.toLowerCase() } : null);
    } catch (error: any) {
      setUsernameError(error.message);
    } finally {
      setIsSavingUsername(false);
    }
  };

  const statCards = [
    { label: t('sidebar.invoices'), value: statsData.totalInvoices.toString(), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: t('dashboard.paidInvoices'), value: formatCurrency(statsData.paidInvoicesAmount, dashboardCurrency), icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: t('dashboard.pendingInvoices'), value: formatCurrency(statsData.unpaidInvoicesAmount, dashboardCurrency), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: t('dashboard.totalRevenue'), value: formatCurrency(statsData.totalRevenue, dashboardCurrency), icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const brand = userBranding?.brand_color || '#6366f1';

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <PageTransition>
      <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('sidebar.dashboard')}</h1>
          <p className="text-slate-500 text-sm">
            {t('dashboard.welcome')}{userBranding?.username ? `, ${userBranding.username}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
            <Globe size={16} className="text-slate-400" />
            <select
              className="text-sm font-medium text-slate-700 bg-transparent focus:outline-none"
              value={dashboardCurrency}
              onChange={(e) => setDashboardCurrency(e.target.value)}
            >
              {CURRENCIES.map(curr => (
                <option key={curr.code} value={curr.code}>{curr.code}</option>
              ))}
            </select>
          </div>
          <Link href="/dashboard/invoices/new">
            <Button className="flex items-center gap-2">
              <Plus size={18} />
              {t('invoices.newInvoice')}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: "spring" }}
          >
            <TiltCard>
              <Card>
                <CardContent className="p-6 cursor-pointer">
                   <div className="flex items-center justify-between pointer-events-none">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{stat.label}</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={cn('p-3 rounded-lg', stat.bg)}>
                      <stat.icon className={stat.color} size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TiltCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{t('dashboard.recentInvoices')}</h2>
              <Link href="/dashboard/invoices" className="text-sm text-indigo-600 font-medium hover:underline">
                {t('common.viewAll')}
              </Link>
            </div>
            {recentInvoices.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-3 font-medium bg-slate-50 whitespace-nowrap">{t('sidebar.invoices')}</th>
                      <th className="px-6 py-3 font-medium bg-slate-50 whitespace-nowrap">{t('sidebar.clients')}</th>
                      <th className="px-6 py-3 font-medium text-right bg-slate-50 whitespace-nowrap">{t('invoices.amount')}</th>
                      <th className="px-6 py-3 font-medium text-center bg-slate-50 whitespace-nowrap">{t('common.status')}</th>
                      <th className="px-6 py-3 font-medium text-right bg-slate-50 whitespace-nowrap">{t('invoices.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentInvoices.map((inv, index) => (
                      <motion.tr 
                        key={inv.id} 
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 whitespace-nowrap">{inv.invoice_number}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{inv.clients?.name || 'Deleted Client'}</td>
                        <td className="px-6 py-4 text-sm text-slate-900 font-medium text-right whitespace-nowrap">
                          <div className="flex flex-col items-end leading-tight">
                            <span>{formatCurrency(inv.total_amount, inv.currency || 'USD')}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-normal">{inv.currency || 'USD'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            inv.status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                          )}>
                            {inv.status === 'paid' ? t('invoices.status.paid') : t('invoices.unpaid')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-400 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {inv.status === 'unpaid' && (
                              <button onClick={() => markAsPaid(inv.id)} className="p-1 hover:text-emerald-600 transition-colors" title="Mark as Paid">
                                <CheckCircle size={16} />
                              </button>
                            )}
                            <button onClick={() => handlePreview(inv)} className="p-1 hover:text-indigo-600 transition-colors" title="Preview">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            <button onClick={() => handleDownload(inv)} className="p-1 hover:text-amber-600 transition-colors" title="Download PDF">
                              <Download size={16} />
                            </button>
                            <button onClick={() => handleOpenEmailModal(inv)} className="p-1 hover:text-indigo-600 transition-colors" title="Send Email">
                              <Mail size={16} />
                            </button>
                            <button onClick={() => handleDelete(inv.id)} className="p-1 hover:text-rose-600 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">
                <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <FileText className="text-slate-400" size={24} />
                </div>
                <h3 className="text-sm font-medium text-slate-900">{t('invoices.noInvoices')}</h3>
                <Link href="/dashboard/invoices/new" className="mt-4 inline-block">
                  <Button variant="outline" size="sm">{t('invoices.newInvoice')}</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{t('dashboard.topClients')}</h2>
              <Link href="/dashboard/clients" className="text-sm text-indigo-600 font-medium hover:underline">
                {t('dashboard.manageClients')}
              </Link>
            </div>
            {topClients.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-3 font-medium bg-slate-50">{t('sidebar.clients')}</th>
                      <th className="px-6 py-3 font-medium bg-slate-50">{t('settings.email')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topClients.map((client, index) => (
                      <motion.tr 
                        key={client.id} 
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{client.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{client.email}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">
                <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Users className="text-slate-400" size={24} />
                </div>
                <h3 className="text-sm font-medium text-slate-900">{t('dashboard.noClients')}</h3>
                <Link href="/dashboard/clients/new" className="mt-4 inline-block">
                  <Button variant="outline" size="sm">{t('dashboard.addClientBtn')}</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Invoice Preview Modal (template-aware, shared component) ── */}
      <InvoicePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => { setIsPreviewOpen(false); setSelectedInvoice(null); }}
        invoice={selectedInvoice}
        loading={previewLoading}
        onDownload={(inv) => handleDownload(inv)}
      />

      {/* ── Email Modal ── */}
      <Modal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} title="Send Invoice" maxWidth="sm">
        {emailSent ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-900">Email Sent!</p>
              <p className="text-sm text-slate-500 mt-1">Invoice <span className="font-medium">{emailInvoiceNumber}</span> sent to <span className="font-medium">{emailTo}</span></p>
            </div>
            <Button variant="outline" onClick={() => setIsEmailModalOpen(false)} className="mt-2">Close</Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Recipient Email</label>
              <input type="email" className="flex h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="client@example.com" value={emailTo} onChange={e => setEmailTo(e.target.value)} autoFocus />
            </div>
            <div className="bg-slate-50 rounded-lg p-4 space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sending</p>
              <p className="text-sm font-semibold text-slate-900">Invoice {emailInvoiceNumber}</p>
              <p className="text-sm text-slate-500">Total: <span className="font-medium text-slate-900">{formatCurrency(emailTotal, emailCurrency)}</span></p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsEmailModalOpen(false)}>Cancel</Button>
              <Button className="flex-1 flex items-center justify-center gap-2" onClick={sendEmail} isLoading={emailSending}>
                <Send size={16} /> Send Email
              </Button>
            </div>
          </div>
        )}
      </Modal>

      </div>
    </PageTransition>
  );
}
