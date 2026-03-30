'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, FileText, ArrowRight, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { formatCurrency, formatDate, cn } from '@/utils/format';
import Link from 'next/link';
import { useTranslation } from '@/contexts/LanguageContext';

const PAGE_SIZE = 10;

export default function EstimatesPage() {
  const { t } = useTranslation();
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [brandColor, setBrandColor] = useState('#6366f1');

  const fetchEstimates = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const [estimatesRes, profileRes] = await Promise.all([
        supabase.from('estimates')
          .select('id, estimate_number, client_id, total_amount, currency, status, created_at, expiry_date, tax_rate, user_id, clients(name)')
          .order('created_at', { ascending: false }),
        user ? supabase.from('profiles').select('brand_color').eq('id', user.id).single() : Promise.resolve({ data: null })
      ]);

      if (estimatesRes.data) setEstimates(estimatesRes.data);
      if (profileRes.data?.brand_color) setBrandColor(profileRes.data.brand_color);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEstimates(); }, [fetchEstimates]);

  // Reset page when search changes
  useEffect(() => { setCurrentPage(1); }, [search]);

  const filteredEstimates = estimates.filter(e =>
    e.estimate_number?.toLowerCase().includes(search.toLowerCase()) ||
    e.clients?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredEstimates.length / PAGE_SIZE));
  const paginatedEstimates = filteredEstimates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const convertToInvoice = async (estimate: any) => {
    if (!confirm(t('estimates.convertConfirm') || 'Convert this estimate to an invoice?')) return;
    try {
      const { data: items } = await supabase.from('estimate_items').select('*').eq('estimate_id', estimate.id);
      if (!items) throw new Error('No items found');

      const currentYear = new Date().getFullYear();
      const prefix = `INV-${currentYear}-`;
      const { data: allInvoices } = await supabase.from('invoices').select('invoice_number')
        .eq('user_id', estimate.user_id).ilike('invoice_number', `${prefix}%`);

      let nextNum = 1;
      if (allInvoices?.length) {
        const nums = allInvoices.map(inv => parseInt(inv.invoice_number.split('-').pop() || '0'));
        nextNum = Math.max(...nums) + 1;
      }

      const { data: invoice, error: invError } = await supabase.from('invoices').insert([{
        user_id: estimate.user_id,
        client_id: estimate.client_id,
        invoice_number: `${prefix}${nextNum.toString().padStart(4, '0')}`,
        due_date: estimate.expiry_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tax_rate: estimate.tax_rate,
        total_amount: estimate.total_amount,
        currency: estimate.currency,
        status: 'unpaid'
      }]).select().single();

      if (invError) throw invError;

      await supabase.from('invoice_items').insert(items.map(i => ({
        invoice_id: invoice.id, description: i.description, quantity: i.quantity, unit_price: i.unit_price
      })));

      await supabase.from('estimates').update({ status: 'converted' }).eq('id', estimate.id);
      alert(t('estimates.convertSuccess') || 'Successfully converted!');
      fetchEstimates();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const statusColors: Record<string, string> = {
    converted: 'bg-emerald-100 text-emerald-700',
    draft: 'bg-slate-100 text-slate-700',
    sent: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('estimates.title')}</h1>
          <p className="text-slate-500 text-sm">{t('estimates.subtitle')}</p>
        </div>
        <Link href="/dashboard/estimates/new">
          <Button className="flex items-center gap-2">
            <Plus size={18} /> {t('estimates.newEstimate')}
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
            <Search size={18} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder={t('estimates.search_placeholder') || 'Search by estimate number or client...'}
              className="bg-transparent border-none focus:outline-none text-sm w-full"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">{t('estimates.estimate')}</th>
                  <th className="px-6 py-4 font-medium">{t('estimates.client')}</th>
                  <th className="px-6 py-4 font-medium">{t('estimates.amount')}</th>
                  <th className="px-6 py-4 font-medium">{t('estimates.status')}</th>
                  <th className="px-6 py-4 font-medium">{t('estimates.date')}</th>
                  <th className="px-6 py-4 font-medium text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Loading estimates...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedEstimates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <FileText size={32} className="text-slate-300" />
                        <p className="text-sm">{t('estimates.noEstimates')}</p>
                        <Link href="/dashboard/estimates/new">
                          <Button variant="outline" size="sm">{t('estimates.newEstimate')}</Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedEstimates.map((est) => (
                    <tr key={est.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <FileText size={16} />
                          </div>
                          <span className="font-semibold text-slate-900 text-sm">{est.estimate_number}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{est.clients?.name}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        {formatCurrency(est.total_amount, est.currency)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'px-2 py-1 rounded-full text-[10px] font-bold uppercase',
                          statusColors[est.status] || 'bg-slate-100 text-slate-700'
                        )}>
                          {t(`estimates.${est.status}`) || est.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatDate(est.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        {est.status !== 'converted' && (
                          <Button variant="ghost" size="sm"
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            onClick={() => convertToInvoice(est)}>
                            {t('estimates.convert')} <ArrowRight size={14} className="ml-1" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {!loading && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredEstimates.length)} of {filteredEstimates.length} estimates
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                  <button key={pg} onClick={() => setCurrentPage(pg)}
                    className={cn("w-8 h-8 rounded-lg text-xs font-medium transition-colors",
                      pg === currentPage ? "text-white shadow-sm" : "text-slate-600 border border-slate-200 hover:bg-slate-50"
                    )}
                    style={pg === currentPage ? { backgroundColor: brandColor } : {}}>
                    {pg}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
