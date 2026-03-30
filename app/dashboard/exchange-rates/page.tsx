'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { ArrowUpRight, ArrowDownRight, Activity, Calendar } from 'lucide-react';
import { getExchangeHistory } from '@/utils/rateSync';
import { useTranslation } from '@/contexts/LanguageContext';

export default function ExchangeRatesPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any>(null);
  const [baseCurrency] = useState('USD');
  const targetCurrencies = ['INR', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

  useEffect(() => {
    fetchHistory();
  }, [baseCurrency]);

  const fetchHistory = async () => {
    setLoading(true);
    const data = await getExchangeHistory(baseCurrency);
    if (data) {
      setHistory(data);
    }
    setLoading(false);
  };

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="text-indigo-600" />
            {t('exchange.title')}
          </h1>
          <p className="text-slate-500 text-sm">{t('exchange.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="overflow-hidden border-slate-200 shadow-xl">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-slate-400" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">{t('exchange.marketTrends')}</span>
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase bg-white px-2 py-1 rounded border border-slate-200">
              {t('exchange.base')}: {baseCurrency}
            </div>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                  <tr>
                    <th className="px-6 py-4">{t('exchange.pair')}</th>
                    {history && Object.keys(history).slice(-5).map(date => (
                      <th key={date} className="px-6 py-4 text-center">{getDayLabel(date)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400 animate-pulse">
                        {t('exchange.loading')}
                      </td>
                    </tr>
                  ) : history ? (
                    targetCurrencies.map(symbol => (
                      <tr key={symbol} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600 border border-indigo-100">
                              {symbol}
                            </div>
                            <span className="text-sm font-bold text-slate-900">{baseCurrency} / {symbol}</span>
                          </div>
                        </td>
                        {Object.entries(history).slice(-5).map(([date, rates]: [string, any], idx, arr) => {
                          const currentRate = rates[symbol];
                          const prevRate = idx > 0 ? (arr[idx-1][1] as any)[symbol] : null;
                          const isUp = prevRate ? currentRate > prevRate : null;

                          return (
                            <td key={date} className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-sm font-black text-slate-700">
                                  {currentRate?.toFixed(2)}
                                </span>
                                {isUp !== null && (
                                  <span className={`text-[10px] font-bold flex items-center ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                    {prevRate ? Math.abs(((currentRate - prevRate) / prevRate) * 100).toFixed(2) : '0.00'}%
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        {t('exchange.unavailable')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-indigo-600 border-none shadow-indigo-200/50 shadow-lg">
          <CardContent className="p-6 text-white">
            <p className="text-[10px] font-black tracking-widest uppercase text-indigo-200">{t('exchange.statusTitle')}</p>
            <h4 className="text-xl font-bold mt-1">{t('exchange.statusHealthy')}</h4>
            <p className="text-sm text-indigo-100 mt-2">{t('exchange.statusDesc')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
