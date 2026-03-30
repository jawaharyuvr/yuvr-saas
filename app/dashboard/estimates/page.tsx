'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, ArrowRight, MoreVertical, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/utils/format';
import Link from 'next/link';
import { useTranslation } from '@/contexts/LanguageContext';

export default function EstimatesPage() {
  const { t } = useTranslation();
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchEstimates();
  }, []);

  const fetchEstimates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('estimates')
      .select('*, clients(name)')
      .order('created_at', { ascending: false });
    
    if (data) setEstimates(data);
    setLoading(false);
  };

  const convertToInvoice = async (estimate: any) => {
    if (!confirm(t('estimates.convertConfirm') || 'Are you sure you want to convert this estimate to an invoice?')) return;
    
    try {
      // 1. Fetch estimate items
      const { data: items } = await supabase
        .from('estimate_items')
        .select('*')
        .eq('estimate_id', estimate.id);
      
      if (!items) throw new Error('No items found');

      // 2. Fetch robust next invoice number (Max + 1)
      const currentYear = new Date().getFullYear();
      const prefix = `INV-${currentYear}-`;
      const { data: allInvoices } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('user_id', estimate.user_id)
        .ilike('invoice_number', `${prefix}%`);
      
      let nextNum = 1;
      if (allInvoices && allInvoices.length > 0) {
        // Extract numbers and find max numerically
        const nums = allInvoices.map(inv => {
          const parts = inv.invoice_number.split('-');
          return parseInt(parts[parts.length - 1] || '0');
        });
        nextNum = Math.max(...nums) + 1;
      }
      const newInvoiceNumber = `${prefix}${nextNum.toString().padStart(4, '0')}`;

      // 3. Create invoice
      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .insert([{
          user_id: estimate.user_id,
          client_id: estimate.client_id,
          invoice_number: newInvoiceNumber,
          // Use estimate expiry date if available, otherwise default to 7 days from now
          due_date: estimate.expiry_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          tax_rate: estimate.tax_rate,
          total_amount: estimate.total_amount,
          currency: estimate.currency,
          status: 'unpaid'
        }])
        .select()
        .single();
      
      if (invError) throw invError;

      // 3. Create invoice items
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(items.map(i => ({
          invoice_id: invoice.id,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price
        })));
      
      if (itemsError) throw itemsError;

      // 4. Update estimate status
      await supabase.from('estimates').update({ status: 'converted' }).eq('id', estimate.id);
      
      alert(t('estimates.convertSuccess') || 'Successfully converted to invoice!');
      fetchEstimates();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filteredEstimates = estimates.filter(e => 
    e.estimate_number.toLowerCase().includes(search.toLowerCase()) ||
    e.clients?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
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

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text" 
              placeholder={t('estimates.search_placeholder') || "Search by estimate number or client..."} 
              className="bg-transparent border-none focus:outline-none text-sm w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">{t('estimates.estimate')}</th>
                <th className="px-6 py-4 font-medium">{t('estimates.client')}</th>
                <th className="px-6 py-4 font-medium">{t('estimates.amount')}</th>
                <th className="px-6 py-4 font-medium">{t('estimates.status')}</th>
                <th className="px-6 py-4 font-medium">{t('estimates.date')}</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic-last-row">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">{t('estimates.loading')}</td>
                </tr>
              ) : filteredEstimates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">{t('estimates.noEstimates')}</td>
                </tr>
              ) : (
                filteredEstimates.map((est) => (
                  <tr key={est.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          <FileText size={16} />
                        </div>
                        <span className="font-semibold text-slate-900">{est.estimate_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{est.clients?.name}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {formatCurrency(est.total_amount, est.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        est.status === 'converted' ? 'bg-emerald-100 text-emerald-700' :
                        est.status === 'draft' ? 'bg-slate-100 text-slate-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {t(`estimates.${est.status}`) || est.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(est.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      {est.status !== 'converted' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          onClick={() => convertToInvoice(est)}
                        >
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
      </div>
    </div>
  );
}
