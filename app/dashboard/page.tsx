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
  clients: { name: string } | null;
  tax_rate: number;
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
  } | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailInvoiceNumber, setEmailInvoiceNumber] = useState('');
  const [emailTotal, setEmailTotal] = useState(0);
  const [emailCurrency, setEmailCurrency] = useState('USD');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [selectedEmailInvoice, setSelectedEmailInvoice] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [dashboardCurrency]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch Profile for Logo/Branding
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('logo_url, company_name, brand_color, custom_font, invoice_template')
        .eq('id', user.id)
        .single();
      
      console.log('Fetched Profile:', { profile, profileError });
      
      if (profile) {
        setUserProfile(profile);
      } else if (profileError) {
        console.warn('Profile fetch error (possibly non-existent):', profileError);
      }

      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('total_amount, currency, status, invoice_number, id, due_date, tax_rate, clients(name, email, address)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (invError) {
        console.error('Supabase error fetching invoices:', invError);
        throw invError;
      }
// ... (rest of fetchDashboardData remains same)
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
      generateInvoicePDF({
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
        companyName: userProfile?.company_name
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
      // 1. Fetch full items to generate PDF
      const { data: items } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', selectedEmailInvoice.id);

      // 2. Generate PDF Base64
      const pdfBase64 = generateInvoicePDF({
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
        template: userProfile?.invoice_template
      }, true);

      // 3. Send Email
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

  const statCards = [
    { label: 'Total Invoices', value: statsData.totalInvoices.toString(), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Paid Invoices', value: formatCurrency(statsData.paidInvoicesAmount, dashboardCurrency), icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Unpaid Invoices', value: formatCurrency(statsData.unpaidInvoicesAmount, dashboardCurrency), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Revenue', value: formatCurrency(statsData.totalRevenue, dashboardCurrency), icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm">Welcome back! Here's what's happening today.</p>
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

      {selectedInvoice && (
        <Modal 
          isOpen={isPreviewOpen} 
          onClose={() => setIsPreviewOpen(false)} 
          title="Invoice Preview"
          maxWidth="2xl"
        >
          <div className={`space-y-0 overflow-hidden rounded-xl border transition-all duration-500 relative ${
            userProfile?.invoice_template === 'dark_mode' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
          }`}>
            {userProfile?.invoice_template === 'creative_agency' && (
              <div className="absolute right-0 top-0 w-48 h-48 opacity-20 -mr-24 -mt-24 rounded-full" style={{ backgroundColor: userProfile?.brand_color }}></div>
            )}
            {userProfile?.invoice_template === 'bold_modern' && (
              <div className="absolute left-0 top-0 w-4 h-48" style={{ backgroundColor: userProfile?.brand_color }}></div>
            )}
            {userProfile?.invoice_template === 'tech_startup' && (
              <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: userProfile?.brand_color }}></div>
            )}
            {userProfile?.invoice_template === 'premium_finance' && (
              <div className="absolute top-0 left-0 bottom-0 w-px bg-slate-200" style={{ boxShadow: `3px 0 0 ${userProfile?.brand_color}` }}></div>
            )}

            <div className="p-8 space-y-8 relative" style={{ fontFamily: userProfile?.custom_font === 'Inter' ? 'Inter, sans-serif' : userProfile?.custom_font }}>
              <div className={`flex ${
                userProfile?.invoice_template === 'elegant_luxury' ? 'flex-col items-center text-center' : 'justify-between items-start'
              } ${userProfile?.invoice_template === 'bold_modern' ? 'pl-6' : ''}`}>
                <div className="space-y-3">
                  <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center text-xs text-slate-400 font-bold border-2 border-dashed border-slate-200 overflow-hidden shadow-sm">
                    {userProfile?.logo_url ? <img src={userProfile.logo_url} className="w-full h-full object-contain" /> : 'LOGO'}
                  </div>
                  {userProfile?.invoice_template === 'tech_startup' && (
                    <p className="text-lg font-bold text-slate-900" style={{ color: userProfile?.brand_color }}>{userProfile?.company_name || 'Your Company'}</p>
                  )}
                </div>
                <div className={userProfile?.invoice_template === 'elegant_luxury' ? 'mt-6' : 'text-right'}>
                  <h4 className={`font-black text-[28px] leading-none tracking-tighter ${
                    userProfile?.invoice_template === 'dark_mode' ? 'text-white' : 
                    userProfile?.invoice_template === 'elegant_luxury' ? 'tracking-[0.3em] text-slate-800' : 'text-slate-900'
                  }`} style={{ 
                    color: (userProfile?.invoice_template === 'bold_modern' || userProfile?.invoice_template === 'creative_agency') ? userProfile?.brand_color : undefined 
                  }}>INVOICE</h4>
                  <p className="text-slate-400 font-bold mt-2 uppercase tracking-tight text-sm">#{selectedInvoice.invoice_number}</p>
                </div>
              </div>

              <div className={`grid grid-cols-2 gap-12 pt-8 border-t ${
                userProfile?.invoice_template === 'dark_mode' ? 'border-slate-700' : 'border-slate-100'
              }`}>
                <div className="space-y-2">
                  <p className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Bill To</p>
                  <p className={`font-black text-lg leading-tight ${userProfile?.invoice_template === 'dark_mode' ? 'text-white' : 'text-slate-900'}`}>{selectedInvoice.client?.name}</p>
                  <div className="text-slate-500 space-y-1 text-sm">
                    <p>{selectedInvoice.client?.email}</p>
                    {selectedInvoice.client?.address && <p className="italic max-w-[250px] leading-relaxed">{selectedInvoice.client.address}</p>}
                  </div>
                </div>
                <div className="text-right space-y-3">
                  <div className="flex justify-between pl-12">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Issue Date</span>
                    <span className={`font-medium ${userProfile?.invoice_template === 'dark_mode' ? 'text-slate-200' : 'text-slate-700'}`}>{formatDate(new Date())}</span>
                  </div>
                  <div className="flex justify-between pl-12">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Due Date</span>
                    <span className="font-bold text-lg" style={{ color: userProfile?.brand_color }}>{formatDate(selectedInvoice.due_date)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className={`flex justify-between py-3 px-4 items-center rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-sm ${
                  userProfile?.invoice_template === 'dark_mode' ? 'bg-slate-700/50 text-slate-300' : 
                  (userProfile?.invoice_template === 'scandinavian_minimal' ? 'bg-white border-b border-slate-200 text-slate-400 shadow-none' : 'bg-slate-50 text-slate-500')
                }`} style={{ 
                  backgroundColor: (userProfile?.invoice_template !== 'scandinavian_minimal' && userProfile?.invoice_template !== 'dark_mode') ? `${userProfile?.brand_color}15` : undefined,
                  color: (userProfile?.invoice_template !== 'scandinavian_minimal' && userProfile?.invoice_template !== 'dark_mode') ? userProfile?.brand_color : undefined
                }}>
                  <span className="flex-1">Description</span>
                  <div className="flex gap-12 text-right">
                    <span className="w-12">Qty</span>
                    <span className="w-24">Price</span>
                    <span className="w-24">Total</span>
                  </div>
                </div>
                <div className="space-y-0 px-1">
                  {selectedInvoice.items?.map((item: any, idx: number) => (
                    <React.Fragment key={idx}>
                      <div className="flex justify-between items-center py-5 group transition-colors">
                        <div className="space-y-1 flex-1">
                          <p className={`font-bold text-base ${userProfile?.invoice_template === 'dark_mode' ? 'text-white' : 'text-slate-800'}`}>{item.description}</p>
                        </div>
                        <div className="flex gap-12 font-bold text-right items-center">
                          <span className="text-slate-400 w-12">{item.quantity.toString().padStart(2, '0')}</span>
                          <span className={`w-24 ${userProfile?.invoice_template === 'dark_mode' ? 'text-slate-300' : 'text-slate-600'}`}>{formatCurrency(item.price, selectedInvoice.currency)}</span>
                          <span className={`w-24 text-base ${userProfile?.invoice_template === 'dark_mode' ? 'text-white' : 'text-slate-900'}`}>
                            {formatCurrency(item.quantity * item.price, selectedInvoice.currency)}
                          </span>
                        </div>
                      </div>
                      <div className={`h-px w-full ${userProfile?.invoice_template === 'dark_mode' ? 'bg-slate-700/50' : 'bg-slate-50'}`}></div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <div className="w-full max-w-[280px] space-y-3 p-6 rounded-2xl bg-slate-50/50" style={{ 
                  backgroundColor: userProfile?.invoice_template === 'dark_mode' ? 'rgba(30, 41, 59, 0.5)' : undefined 
                }}>
                  {(() => {
                    const subtotal = selectedInvoice.items?.length 
                      ? selectedInvoice.items.reduce((sum: number, item: any) => sum + (item.quantity * (item.unit_price || item.price)), 0)
                      : (selectedInvoice.total_amount / (1 + (selectedInvoice.tax_rate || 0)/100));
                    const taxAmount = selectedInvoice.total_amount - subtotal;
                    return (
                      <>
                        <div className="flex justify-between text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                          <span>Subtotal</span>
                          <span className={userProfile?.invoice_template === 'dark_mode' ? 'text-slate-300' : 'text-slate-700'}>{formatCurrency(subtotal, selectedInvoice.currency)}</span>
                        </div>
                        {selectedInvoice.tax_rate > 0 && (
                          <div className="flex justify-between text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                            <span>Tax ({selectedInvoice.tax_rate}%)</span>
                            <span className={userProfile?.invoice_template === 'dark_mode' ? 'text-slate-300' : 'text-slate-700'}>{formatCurrency(taxAmount, selectedInvoice.currency)}</span>
                          </div>
                        )}
                        <div className={`h-px ${userProfile?.invoice_template === 'dark_mode' ? 'bg-slate-700' : 'bg-slate-200'} my-2`}></div>
                        <div className="flex justify-between items-center">
                          <span className="font-black text-xs tracking-widest text-slate-400 uppercase">Total Due</span>
                          <span className="font-black text-2xl" style={{ color: userProfile?.invoice_template === 'dark_mode' ? '#fff' : userProfile?.brand_color }}>
                            {formatCurrency(selectedInvoice.total_amount, selectedInvoice.currency)}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="pt-12 flex justify-between items-end">
                <div className="space-y-6">
                  <div className="w-48 h-px bg-slate-300 opacity-30"></div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.2em]">Authorized Signature</p>
                    <p className="text-[10px] text-slate-500 font-medium italic">Yuvr-SaaS Certified Invoicing</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-400 font-medium max-w-[200px] leading-relaxed italic">
                    Thank you for your business. For any inquiries, please contact {userProfile?.company_name || 'our support'}.
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-6 flex justify-center gap-4 border-t ${
              userProfile?.invoice_template === 'dark_mode' ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50/50 border-slate-100'
            }`}>
              <Button onClick={() => handleDownload(selectedInvoice)} className="flex items-center gap-2 px-8 shadow-lg shadow-indigo-500/20">
                <Download size={18} /> Download PDF
              </Button>
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)} className="bg-white">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Email Send Modal */}
      <Modal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        title="Send Invoice via Email"
        maxWidth="sm"
      >
        {emailSent ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-900">Email Sent!</p>
              <p className="text-sm text-slate-500 mt-1">
                Invoice <span className="font-medium">{emailInvoiceNumber}</span> has been sent to{' '}
                <span className="font-medium">{emailTo}</span>
              </p>
            </div>
            <Button variant="outline" onClick={() => setIsEmailModalOpen(false)} className="mt-2">Close</Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Recipient Email</label>
              <input
                type="email"
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="client@example.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-slate-400">Pre-filled from the client. You can edit it.</p>
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
  );
}
