'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, FileText, Download, Trash2, CheckCircle, Mail, Send, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate, cn } from '@/utils/format';
import { Modal } from '@/components/ui/Modal';
import { generateInvoicePDF } from '@/utils/pdf';
import { buildInvoiceData, fetchUserBranding, type UserBranding, type AssembledInvoice } from '@/utils/invoiceEngine';
import { InvoicePreviewModal } from '@/components/InvoicePreviewModal';
import { useTranslation } from '@/contexts/LanguageContext';
import { PageTransition } from '@/components/ui/PageTransition';

const PAGE_SIZE = 10;

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  due_date: string;
  created_at: string;
  currency: string;
  tax_rate: number;
  clients: { name: string; email: string; address?: string } | null;
}

export default function InvoicesPage() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Preview state
  const [selectedInvoice, setSelectedInvoice] = useState<AssembledInvoice | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Branding (fetched once)
  const [userBranding, setUserBranding] = useState<UserBranding | null>(null);

  // Email modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailInvoiceNumber, setEmailInvoiceNumber] = useState('');
  const [emailTotal, setEmailTotal] = useState(0);
  const [emailCurrency, setEmailCurrency] = useState('USD');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [selectedEmailInvoiceId, setSelectedEmailInvoiceId] = useState<string | null>(null);

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(invoices.length / PAGE_SIZE));
  const paginatedInvoices = invoices.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [branding, invoicesRes] = await Promise.all([
        fetchUserBranding(),
        supabase.from('invoices')
          .select('id, invoice_number, total_amount, status, due_date, created_at, currency, tax_rate, clients(name, email, address)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (branding) setUserBranding(branding);
      if (invoicesRes.data) setInvoices(invoicesRes.data as any);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const markAsPaid = async (id: string) => {
    await supabase.from('invoices').update({ status: 'paid' }).eq('id', id);
    fetchInvoices();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('invoices.deleteConfirm') || 'Are you sure?')) return;
    await supabase.from('invoices').delete().eq('id', id);
    fetchInvoices();
  };

  const handlePreview = async (inv: Invoice) => {
    setPreviewLoading(true);
    setIsPreviewOpen(true);
    setSelectedInvoice(null);
    const assembled = await buildInvoiceData(inv.id, userBranding);
    setSelectedInvoice(assembled);
    setPreviewLoading(false);
  };

  const handleDownload = async (inv: AssembledInvoice | Invoice) => {
    // Accept either an AssembledInvoice (from preview) or a raw Invoice row
    let assembled: AssembledInvoice | null;
    if ('items' in inv && 'template' in inv) {
      // Already assembled
      assembled = inv as AssembledInvoice;
    } else {
      assembled = await buildInvoiceData((inv as Invoice).id, userBranding);
    }
    if (!assembled) return;
    await generateInvoicePDF(assembled);
  };

  const handleOpenEmailModal = (inv: Invoice) => {
    setSelectedEmailInvoiceId(inv.id);
    setEmailTo(inv.clients?.email || '');
    setEmailInvoiceNumber(inv.invoice_number);
    setEmailTotal(inv.total_amount);
    setEmailCurrency(inv.currency || 'USD');
    setEmailSent(false);
    setIsEmailModalOpen(true);
  };

  const sendEmail = async () => {
    if (!emailTo.includes('@')) return alert('Please enter a valid email address');
    if (!selectedEmailInvoiceId) return;
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
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed');
      setEmailSent(true);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setEmailSending(false);
    }
  };

  const brand = userBranding?.brand_color || '#6366f1';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('invoices.title')}</h1>
            <p className="text-slate-500 text-sm">{t('invoices.subtitle')}</p>
          </div>
          <Link href="/dashboard/invoices/new">
            <Button className="flex items-center gap-2">
              <Plus size={18} /> {t('invoices.newInvoice')}
            </Button>
          </Link>
        </div>

        {/* Table */}
        {loading ? (
          <Card>
            <CardContent className="h-64 flex items-center justify-center text-slate-400">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Loading invoices...</p>
              </div>
            </CardContent>
          </Card>
        ) : invoices.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 font-medium">{t('invoices.invoiceNumber')}</th>
                      <th className="px-6 py-3 font-medium">{t('sidebar.clients')}</th>
                      <th className="px-6 py-3 font-medium">{t('invoices.dueDate')}</th>
                      <th className="px-6 py-3 font-medium text-right">{t('common.amount')}</th>
                      <th className="px-6 py-3 font-medium text-center">{t('common.status')}</th>
                      <th className="px-6 py-3 font-medium text-right">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{inv.invoice_number}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{inv.clients?.name || 'Deleted Client'}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{formatDate(inv.due_date)}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 text-right">
                          <div className="flex flex-col items-end leading-tight">
                            <span>{formatCurrency(inv.total_amount, inv.currency || 'USD')}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-normal">{inv.currency || 'USD'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn('px-2 py-1 rounded-full text-xs font-medium',
                            inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')}>
                            {inv.status === 'paid' ? t('invoices.status.paid') : t('invoices.unpaid')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 text-slate-400">
                            {inv.status === 'unpaid' && (
                              <button onClick={() => markAsPaid(inv.id)} className="p-1 hover:text-emerald-600 transition-colors" title="Mark as Paid">
                                <CheckCircle size={16} />
                              </button>
                            )}
                            <button onClick={() => handlePreview(inv)} className="p-1 hover:text-indigo-600 transition-colors" title="Preview">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            <button onClick={() => handleDownload(inv)} className="p-1 hover:text-indigo-600 transition-colors" title="Download PDF">
                              <Download size={16} />
                            </button>
                            <button onClick={() => handleOpenEmailModal(inv)} className="p-1 hover:text-indigo-600 transition-colors" title="Send Email">
                              <Mail size={16} />
                            </button>
                            <button onClick={() => handleDelete(inv.id)} className="p-1 hover:text-rose-600 transition-colors" title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, invoices.length)} of {invoices.length} invoices
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                      <button
                        key={pg}
                        onClick={() => setCurrentPage(pg)}
                        className={cn(
                          'w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                          pg === currentPage
                            ? 'text-white shadow-sm'
                            : 'text-slate-600 border border-slate-200 hover:bg-slate-50'
                        )}
                        style={pg === currentPage ? { backgroundColor: brand } : {}}
                      >
                        {pg}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="p-12 text-center text-slate-500">
            <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <FileText size={24} className="text-slate-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-900">{t('invoices.empty')}</h3>
            <p className="text-sm mt-1">{t('invoices.emptyDesc')}</p>
            <Link href="/dashboard/invoices/new" className="mt-4 inline-block">
              <Button variant="outline" size="sm">{t('invoices.newInvoice')}</Button>
            </Link>
          </Card>
        )}

        {/* ── Invoice Preview Modal (template-aware) ── */}
        <InvoicePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => { setIsPreviewOpen(false); setSelectedInvoice(null); }}
          invoice={selectedInvoice}
          loading={previewLoading}
          onDownload={(inv) => handleDownload(inv)}
        />

        {/* ── Email Modal ── */}
        <Modal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} title={t('sidebar.invoices')} maxWidth="sm">
          {emailSent ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 size={28} className="text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900">{t('invoices.emailSent')}</p>
                <p className="text-sm text-slate-500 mt-1">Invoice <span className="font-medium">{emailInvoiceNumber}</span> sent to <span className="font-medium">{emailTo}</span></p>
              </div>
              <Button variant="outline" onClick={() => setIsEmailModalOpen(false)} className="mt-2">{t('invoices.close')}</Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">{t('invoices.recipientEmail')}</label>
                <input type="email" className="flex h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="client@example.com" value={emailTo} onChange={e => setEmailTo(e.target.value)} autoFocus />
              </div>
              <div className="bg-slate-50 rounded-lg p-4 space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sending</p>
                <p className="text-sm font-semibold text-slate-900">Invoice {emailInvoiceNumber}</p>
                <p className="text-sm text-slate-500">Total: <span className="font-medium text-slate-900">{formatCurrency(emailTotal, emailCurrency)}</span></p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsEmailModalOpen(false)}>{t('common.cancel')}</Button>
                <Button className="flex-1 flex items-center justify-center gap-2" onClick={sendEmail} isLoading={emailSending}>
                  <Send size={16} /> {t('invoices.sendEmail')}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </PageTransition>
  );
}
