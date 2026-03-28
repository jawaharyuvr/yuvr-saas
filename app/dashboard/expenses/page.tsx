'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { IndianRupee, Plus, Search, Tag, Calendar, Trash2, PieChart, TrendingDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/utils/format';

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  expense_date: string;
}

export default function ExpensesPage() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Expense>>({
    category: 'Rent',
    amount: 0,
    description: '',
    expense_date: new Date().toISOString().split('T')[0]
  });

  const categories = ['Rent', 'Salaries', 'Utilities', 'Inventory', 'Marketing', 'Software', 'Others'];

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

      const { error } = await supabase
        .from('expenses')
        .insert({ ...form, user_id: user.id });

      if (error) throw error;
      setIsModalOpen(false);
      fetchExpenses();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchExpenses();
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expense Tracking</h1>
          <p className="text-slate-500 text-sm">Monitor your outgoing payments and overhead costs.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus size={18} />
          Log Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="bg-rose-50 border-rose-100 shadow-sm">
            <CardContent className="p-6">
               <div className="flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest">Total Expenses</p>
                    <p className="text-3xl font-black text-rose-600 mt-1">{formatCurrency(totalExpenses, 'USD')}</p>
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
          <div className="p-4 border-b bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Transactions</div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">Crunching your numbers...</td></tr>
              ) : expenses.length > 0 ? (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{e.expense_date}</td>
                    <td className="px-6 py-4">
                       <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-tighter">{e.category}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{e.description || 'No description'}</td>
                    <td className="px-6 py-4 text-sm font-black text-rose-600 text-right">{formatCurrency(e.amount, 'USD')}</td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => handleDelete(e.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors">
                          <Trash2 size={16} />
                       </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <PieChart size={32} className="text-slate-200" />
                      </div>
                      <p className="font-bold text-slate-900">No expenses logged</p>
                      <p className="text-sm">Start tracking your business overheads.</p>
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
                   Log New Expense
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white transition-colors">✕</button>
             </div>
             <CardContent className="p-6">
                <form onSubmit={handleSave} className="space-y-5">
                   <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Category</label>
                      <select className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                   </div>
                   <Input label="Amount ($)" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({...form, amount: parseFloat(e.target.value)})} required />
                   <Input label="Date" type="date" value={form.expense_date} onChange={(e) => setForm({...form, expense_date: e.target.value})} required />
                   <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Description</label>
                      <textarea className="w-full h-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="What was this for?" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
                   </div>
                   <div className="flex gap-3 pt-4">
                      <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                      <Button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700 font-bold uppercase tracking-widest text-xs">Save Expense</Button>
                   </div>
                </form>
             </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
