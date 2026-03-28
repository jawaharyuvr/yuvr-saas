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
  Eye, 
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
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/utils/format';

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
  status: string;
  due_date: string;
  clients: { name: string; email: string; address?: string } | null;
  tax_rate: number;
  created_at?: string;
}

export default function DashboardPage() {
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
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{ 
    logo_url?: string; 
    company_name?: string;
    brand_color?: string;
    custom_font?: string;
    invoice_template?: string;
    username?: string;
    full_name?: string;
    upi_id?: string;
    qr_code_enabled?: boolean;
  } | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailInvoiceNumber, setEmailInvoiceNumber] = useState('');
  const [emailTotal, setEmailTotal] = useState(0);
  const [emailCurrency, setEmailCurrency] = useState('USD');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [selectedEmailInvoice, setSelectedEmailInvoice] = useState<any>(null);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [dashboardCurrency]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch Profile for Logo/Branding/UPI
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setUserProfile(profile);
        if (!profile.username) {
          setIsUsernameModalOpen(true);
        }
      }

      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('total_amount, currency, status, invoice_number, id, due_date, tax_rate, created_at, clients(name, email, address)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (invError) throw invError;

      if (invoices) {
        const stats: DashboardStats = {
          totalInvoices: invoices.length,
          paidInvoicesAmount: invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + convertAmount(Number(inv.total_amount) || 0, inv.currency || 'USD', dashboardCurrency), 0),
          unpaidInvoicesAmount: invoices
            .filter(inv => inv.status === 'unpaid')
            .reduce((sum, inv) => sum + convertAmount(Number(inv.total_amount) || 0, inv.currency || 'USD', dashboardCurrency), 0),
          totalRevenue: invoices
            .reduce((sum, inv) => sum + convertAmount(Number(inv.total_amount) || 0, inv.currency || 'USD', dashboardCurrency), 0),
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
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) alert(error.message);
    else fetchDashboardData();
  };

  const handlePreview = async (inv: RecentInvoice) => {
    const { data } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', inv.id);
    
    if (data) {
      setSelectedInvoice({
        ...inv,
        client: inv.clients,
        items: data.map(item => ({
          description: item.description,
          quantity: item.quantity,
          price: item.unit_price
        }))
      });
      setIsPreviewOpen(true);
    }
  };

  const handleDownload = async (inv: any) => {
    const { data } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', inv.id);
    
    if (data) {
      await generateInvoicePDF({
        invoiceNumber: inv.invoice_number,
        date: new Date(),
        dueDate: new Date(inv.due_date),
        client: {
          name: inv.clients?.name || inv.client?.name || 'Unknown',
          email: inv.clients?.email || inv.client?.email || '',
          address: inv.clients?.address || inv.client?.address || ''
        },
        items: data.map(item => ({
          description: item.description,
          quantity: item.quantity,
          price: item.unit_price
        })),
        taxRate: inv.tax_rate || 0,
        total: inv.total_amount,
        currency: inv.currency || 'USD',
        logoUrl: userProfile?.logo_url,
        companyName: userProfile?.company_name,
        brandColor: userProfile?.brand_color,
        customFont: userProfile?.custom_font,
        template: userProfile?.invoice_template,
        upiId: userProfile?.upi_id,
        qrCodeEnabled: userProfile?.qr_code_enabled
      });
    }
  };

  const handleOpenEmailModal = (inv: RecentInvoice) => {
    const invAny = inv as any;
    setSelectedEmailInvoice(invAny);
    setEmailTo(invAny.clients?.email || '');
    setEmailInvoiceNumber(inv.invoice_number);
    setEmailTotal(inv.total_amount);
    setEmailCurrency(inv.currency || 'USD');
    setEmailSent(false);
    setIsEmailModalOpen(true);
  };

  const sendEmail = async () => {
    if (!emailTo || !emailTo.includes('@')) return alert('Please enter a valid email address');
    if (!selectedEmailInvoice) return alert('No invoice selected');

    setEmailSending(true);
    try {
      const { data: items } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', selectedEmailInvoice.id);

      const pdfBase64 = await generateInvoicePDF({
        invoiceNumber: selectedEmailInvoice.invoice_number,
        date: selectedEmailInvoice.created_at ? new Date(selectedEmailInvoice.created_at) : new Date(),
        dueDate: selectedEmailInvoice.due_date ? new Date(selectedEmailInvoice.due_date) : new Date(),
        client: {
          name: selectedEmailInvoice.clients?.name || 'Unknown',
          email: selectedEmailInvoice.clients?.email || '',
          address: (selectedEmailInvoice.clients as any)?.address || ''
        },
        items: (items || []).map(item => ({
          description: item.description,
          quantity: item.quantity,
          price: item.unit_price
        })),
        taxRate: selectedEmailInvoice.tax_rate || 0,
        total: selectedEmailInvoice.total_amount,
        currency: selectedEmailInvoice.currency || 'USD',
        logoUrl: userProfile?.logo_url,
        companyName: userProfile?.company_name,
        brandColor: userProfile?.brand_color,
        customFont: userProfile?.custom_font,
        template: userProfile?.invoice_template,
        upiId: userProfile?.upi_id,
        qrCodeEnabled: userProfile?.qr_code_enabled
      }, true);

      const res = await fetch('/api/v1/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          to: emailTo, 
          invoiceNumber: emailInvoiceNumber,
          pdfBase64
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
      setUserProfile(prev => prev ? { ...prev, username: newUsername.toLowerCase() } : null);
    } catch (error: any) {
      setUsernameError(error.message);
    } finally {
      setIsSavingUsername(false);
    }
  };

  const statCards = [
    { label: 'Total Invoices', value: statsData.totalInvoices.toString(), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Paid Invoices', value: formatCurrency(statsData.paidInvoicesAmount, dashboardCurrency), icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Unpaid Invoices', value: formatCurrency(statsData.unpaidInvoicesAmount, dashboardCurrency), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Revenue', value: formatCurrency(statsData.totalRevenue, dashboardCurrency), icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-8">
      {/* ... UI content ... */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm">
            Welcome back{userProfile?.username ? `, ${userProfile.username}` : ''}
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
              Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
               <div className="flex items-center justify-between">
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
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Recent Invoices</h2>
              <Link href="/dashboard/invoices" className="text-sm text-indigo-600 font-medium hover:underline">
                View all
              </Link>
            </div>
            {recentInvoices.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-3 font-medium bg-slate-50 whitespace-nowrap">Invoice</th>
                      <th className="px-6 py-3 font-medium bg-slate-50 whitespace-nowrap">Client</th>
                      <th className="px-6 py-3 font-medium text-right bg-slate-50 whitespace-nowrap">Amount</th>
                      <th className="px-6 py-3 font-medium text-center bg-slate-50 whitespace-nowrap">Status</th>
                      <th className="px-6 py-3 font-medium text-right bg-slate-50 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
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
                            {inv.status}
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
                              <Eye size={16} />
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">
                <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <FileText className="text-slate-400" size={24} />
                </div>
                <h3 className="text-sm font-medium text-slate-900">No invoices yet</h3>
                <Link href="/dashboard/invoices/new" className="mt-4 inline-block">
                  <Button variant="outline" size="sm">Create Invoice</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Top Clients</h2>
              <Link href="/dashboard/clients" className="text-sm text-indigo-600 font-medium hover:underline">
                Manage clients
              </Link>
            </div>
            {topClients.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-3 font-medium bg-slate-50">Client</th>
                      <th className="px-6 py-3 font-medium bg-slate-50">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topClients.map((client) => (
                      <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{client.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{client.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">
                <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Users className="text-slate-400" size={24} />
                </div>
                <h3 className="text-sm font-medium text-slate-900">No clients yet</h3>
                <Link href="/dashboard/clients/new" className="mt-4 inline-block">
                  <Button variant="outline" size="sm">Add Client</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ... Preview and Modal code follows ... */}
    </div>
  );
}
