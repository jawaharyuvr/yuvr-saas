'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Tag, Trash2, PieChart, TrendingDown, Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/utils/format';
import { CURRENCIES, convertAmount } from '@/utils/constants';
import { getLiveRate } from '@/utils/rateSync';
import { useTranslation } from '@/contexts/LanguageContext';

interface Expense {
  id: string;
  category: string;
  amount: number;
  currency: string;
  exchange_rate?: number;
  description: string;
  expense_date: string;
}

export default function ExpensesPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewCurrency, setViewCurrency] = useState('USD');
  const [form, setForm] = useState<Partial<Expense>>({
    category: 'Rent',
    amount: 0,
    currency: 'USD',
    description: '',
    expense_date: new Date().toISOString().split('T')[0]
  });

  const categories = [
    t('expenses.cats.rent') || 'Rent', 
    t('expenses.cats.salaries') || 'Salaries', 
    t('expenses.cats.utilities') || 'Utilities', 
    t('expenses.cats.inventory') || 'Inventory', 
    t('expenses.cats.marketing') || 'Marketing', 
    t('expenses.cats.software') || 'Software', 
    t('expenses.cats.others') || 'Others'
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          throw new Error('Database table "expenses" not found. Please run the migration script in your Supabase SQL Editor.');
        }
        throw error;
      }
      setExpenses(data || []);
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch the LIVE rate at the moment of creation for historical accuracy
      const liveRate = await getLiveRate('USD', form.currency || 'USD');

      const { error } = await supabase
        .from('expenses')
        .insert({ 
          ...form, 
          user_id: user.id,
          exchange_rate: liveRate // Storing historical rate
        });

      if (error) throw error;
      setIsModalOpen(false);
      setForm({
        category: 'Rent',
        amount: 0,
        currency: 'USD',
        description: '',
        expense_date: new Date().toISOString().split('T')[0]
      });
      fetchExpenses();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('expenses.deleteConfirm') || 'Are you sure you want to delete this expense?')) return;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchExpenses();
  };

  const totalExpenses = expenses.reduce((sum, e) => 
    sum + convertAmount(Number(e.amount), e.currency || 'USD', viewCurrency), 0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('expenses.title')}</h1>
          <p className="text-slate-500 text-sm">{t('expenses.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
            <Globe size={16} className="text-slate-400" />
            <select
              className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none uppercase tracking-wider"
              value={viewCurrency}
              onChange={(e) => setViewCurrency(e.target.value)}
            >
              {CURRENCIES.map(curr => (
                <option key={curr.code} value={curr.code}>{curr.code}</option>
              ))}
            </select>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus size={18} />
            {t('expenses.logExpense')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="bg-rose-50 border-rose-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
               <TrendingDown size={120} />
            </div>
            <CardContent className="p-6 relative z-10">
               <div className="flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest">{t('expenses.totalExpenses')} ({viewCurrency})</p>
                    <p className="text-3xl font-black text-rose-600 mt-1">{formatCurrency(totalExpenses, viewCurrency)}</p>
                 </div>
                 <div className="p-3 bg-white rounded-xl shadow-sm">
                    <TrendingDown size={28} className="text-rose-500" />
                 </div>
               </div>
            </CardContent>
         </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('expenses.recentTransactions')}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{t('expenses.convertedTo')} {viewCurrency}</span>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
              <tr>
                <th className="px-6 py-4">{t('common.date')}</th>
                <th className="px-6 py-4">{t('expenses.category')}</th>
                <th className="px-6 py-4">{t('expenses.description')}</th>
                <th className="px-6 py-4 text-right">{t('expenses.original')}</th>
                <th className="px-6 py-4 text-right">{t('expenses.converted')} ({viewCurrency})</th>
                <th className="px-6 py-4 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium tracking-wide">{t('common.loading')}</td></tr>
              ) : expenses.length > 0 ? (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium text-slate-600 whitespace-nowrap">{e.expense_date}</td>
                    <td className="px-6 py-4">
                       <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-tighter whitespace-nowrap">{e.category}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{e.description || t('expenses.noDescription')}</td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex flex-col items-end leading-tight">
                         <span className="text-sm font-bold text-slate-600">{formatCurrency(e.amount, e.currency || 'USD')}</span>
                         <span className="text-[9px] text-slate-400 font-black uppercase">{e.currency || 'USD'}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-rose-600 text-right whitespace-nowrap">
                       {formatCurrency(convertAmount(e.amount, e.currency || 'USD', viewCurrency), viewCurrency)}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                       <button onClick={() => handleDelete(e.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors">
                          <Trash2 size={16} />
                       </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <PieChart size={32} className="text-slate-200" />
                      </div>
                      <p className="font-bold text-slate-900">{t('expenses.noExpenses')}</p>
                      <p className="text-sm">{t('expenses.noExpensesDesc')}</p>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="bg-rose-600 p-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                   <Tag size={20} />
                   {t('expenses.newExpense')}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white transition-colors">✕</button>
             </div>
             <CardContent className="p-6">
                <form onSubmit={handleSave} className="space-y-5">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-1 space-y-1.5">
                         <label className="text-xs font-black uppercase text-slate-500 tracking-wider">{t('expenses.category')}</label>
                         <select className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
                           {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                         </select>
                      </div>
                      <div className="col-span-1 space-y-1.5">
                          <label className="text-xs font-black uppercase text-slate-500 tracking-wider">{t('exchange.pair')}</label>
                          <select 
                             className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer" 
                             value={form.currency} 
                             onChange={(e) => setForm({...form, currency: e.target.value})}
                          >
                             {CURRENCIES.map(curr => (
                                <option key={curr.code} value={curr.code}>{curr.code}</option>
                             ))}
                          </select>
                      </div>
                   </div>
                   <Input label={t('common.amount')} type="number" step="0.01" value={form.amount} onChange={(e) => setForm({...form, amount: parseFloat(e.target.value)})} required />
                   <Input label={t('common.date')} type="date" value={form.expense_date} onChange={(e) => setForm({...form, expense_date: e.target.value})} required />
                   <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-slate-500 tracking-wider">{t('expenses.description')}</label>
                      <textarea className="w-full h-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder={t('expenses.descPlaceholder') || 'What was this for?'} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
                   </div>
                   <div className="flex gap-3 pt-4">
                      <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
                      <Button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700 font-bold uppercase tracking-widest text-xs">{t('expenses.saveExpense')}</Button>
                   </div>
                </form>
             </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
