'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  Download, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Globe
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/format';
import { CURRENCIES, convertAmount } from '@/utils/constants';

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    outstanding: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    revenueGrowth: 12.5, // Mock growth
    avgPaymentDays: 4.2
  });
  const [loading, setLoading] = useState(true);
  const [dashboardCurrency, setDashboardCurrency] = useState('USD');

  useEffect(() => {
    fetchAnalytics();
  }, [dashboardCurrency]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const { data: invoices } = await supabase.from('invoices').select('status, total_amount, currency, created_at');
    
    if (invoices) {
      const totalRevenue = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + convertAmount(Number(inv.total_amount) || 0, inv.currency || 'USD', dashboardCurrency), 0);
      
      const outstanding = invoices
        .filter(inv => inv.status === 'unpaid')
        .reduce((sum, inv) => sum + convertAmount(Number(inv.total_amount) || 0, inv.currency || 'USD', dashboardCurrency), 0);
      
      const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
      const pendingInvoices = invoices.filter(inv => inv.status === 'unpaid').length;

      setStats(prev => ({
        ...prev,
        totalRevenue,
        outstanding,
        paidInvoices,
        pendingInvoices
      }));
    }
    setLoading(false);
  };

  const exportReport = () => {
    // Basic CSV Export logic
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Revenue', stats.totalRevenue],
      ['Outstanding Amount', stats.outstanding],
      ['Paid Invoices', stats.paidInvoices],
      ['Pending Invoices', stats.pendingInvoices]
    ];
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">Analytics & Reporting</h1>
          <p className="text-slate-500 text-sm">Track your business performance and financial health.</p>
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
          <Button variant="outline" className="flex items-center gap-2" onClick={exportReport}>
            <Download size={18} /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(stats.totalRevenue, dashboardCurrency)} 
          change="+12.5%" 
          trend="up"
          icon={TrendingUp}
          color="indigo"
        />
        <StatCard 
          title="Outstanding" 
          value={formatCurrency(stats.outstanding, dashboardCurrency)} 
          change="+2.4%" 
          trend="up"
          icon={AlertCircle}
          color="rose"
        />
        <StatCard 
          title="Paid Invoices" 
          value={stats.paidInvoices.toString()} 
          change="+5.2%" 
          trend="up"
          icon={BarChart3}
          color="emerald"
        />
        <StatCard 
          title="Avg. Payment Time" 
          value={`${stats.avgPaymentDays} Days`} 
          change="-0.8%" 
          trend="down"
          icon={Clock}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="overflow-hidden border-slate-200/60 shadow-sm">
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Revenue Overview</h2>
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg">
                <button className="px-3 py-1.5 text-xs font-medium bg-white shadow-sm rounded-md text-slate-900 border border-slate-200">Weekly</button>
                <button className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900">Monthly</button>
              </div>
            </div>
            <div className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                    <tr>
                      <th className="px-6 py-3">Period</th>
                      <th className="px-6 py-3 text-right">Revenue</th>
                      <th className="px-6 py-3 text-right">Invoices</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { period: 'March 2026', rev: stats.totalRevenue, count: stats.paidInvoices },
                      { period: 'February 2026', rev: stats.totalRevenue * 0.8, count: Math.floor(stats.paidInvoices * 0.9) },
                      { period: 'January 2026', rev: stats.totalRevenue * 1.2, count: Math.ceil(stats.paidInvoices * 1.1) }
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">{row.period}</td>
                        <td className="px-6 py-4 text-sm font-bold text-indigo-600 text-right">{formatCurrency(row.rev, dashboardCurrency)}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 text-right">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-slate-200/60 shadow-sm">
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Payment Status</h2>
              <Calendar size={18} className="text-slate-400" />
            </div>
            <div className="p-6 space-y-6">
              <StatusRow label="Paid Invoices" value={stats.paidInvoices} total={stats.paidInvoices + stats.pendingInvoices} color="bg-emerald-500" />
              <StatusRow label="Pending Payment" value={stats.pendingInvoices} total={stats.paidInvoices + stats.pendingInvoices} color="bg-indigo-500" />
              <StatusRow label="Overdue" value={0} total={stats.paidInvoices + stats.pendingInvoices} color="bg-rose-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, trend, icon: Icon, color }: any) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    rose: 'bg-rose-50 text-rose-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600'
  };

  return (
    <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2.5 rounded-xl ${colorMap[color]}`}>
            <Icon size={22} strokeWidth={2.5} />
          </div>
          <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${
            trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {trend === 'up' ? <ArrowUpRight size={12} className="mr-0.5" /> : <ArrowDownRight size={12} className="mr-0.5" />}
            {change}
          </div>
        </div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
      </CardContent>
    </Card>
  );
}

function StatusRow({ label, value, total, color }: any) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{value} ({percentage.toFixed(0)}%)</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-500`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
