'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/utils/format';
import { Modal } from '@/components/ui/Modal';
import { getTaxRateForRegion } from '@/utils/tax';
import { CURRENCIES, convertAmount } from '@/utils/constants';
import { useRouter } from 'next/navigation';

interface Client {
  id: string;
  name: string;
  email: string;
}


interface Product {
  id: string;
  name: string;
  unit_price: number;
  currency: string;
  current_stock: number;
}

interface EstimateItem {
  id: string;
  product_id?: string;
  description: string;
  quantity: number;
  price: number;
}


export default function EstimateForm() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientId, setClientId] = useState('');
  const [estimateNumber, setEstimateNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [items, setItems] = useState<EstimateItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, price: 0 }
  ]);
  const [taxRate, setTaxRate] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [template, setTemplate] = useState<string>('professional_business');
  const [loading, setLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Refs for focus management
  const clientIdRef = React.useRef<HTMLSelectElement>(null);
  const estimateNumberRef = React.useRef<HTMLInputElement>(null);
  const expiryDateRef = React.useRef<HTMLInputElement>(null);
  const taxRateRef = React.useRef<HTMLInputElement>(null);
  const currencyRef = React.useRef<HTMLSelectElement>(null);

  useEffect(() => {
    fetchClients();
    fetchProducts();
    fetchNextEstimateNumber();
    fetchProfile();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('id, name, unit_price, current_stock, currency');
    if (data) setProducts(data);
  };

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('invoice_template')
      .eq('id', user.id)
      .single();
    
    if (profile?.invoice_template) {
      setTemplate(profile.invoice_template);
    }
  };

  const handleNext = (e: React.KeyboardEvent, nextRef: React.RefObject<any>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef.current?.focus();
    }
  };

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, name, email, region');
    if (data) setClients(data as any);
  };

  useEffect(() => {
    if (clientId) {
      const client = clients.find(c => c.id === clientId) as any;
      if (client?.region) {
        const taxInfo = getTaxRateForRegion(client.region);
        setTaxRate(taxInfo.rate);
      }
    }
  }, [clientId, clients]);

  const fetchNextEstimateNumber = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const currentYear = new Date().getFullYear();
    const prefix = `EST-${currentYear}-`;

    const { data: allEstimates } = await supabase
      .from('estimates')
      .select('estimate_number')
      .eq('user_id', user.id)
      .ilike('estimate_number', `${prefix}%`);
    
    let nextNum = 1;
    if (allEstimates && allEstimates.length > 0) {
      const nums = allEstimates.map(est => {
        const parts = est.estimate_number.split('-');
        return parseInt(parts[parts.length - 1] || '0');
      });
      nextNum = Math.max(...nums) + 1;
    }
    
    setEstimateNumber(`${prefix}${nextNum.toString().padStart(4, '0')}`);
  };

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof EstimateItem, value: any) => {
    const val = (field === 'quantity' || field === 'price') ? Number(value) : value;
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: val };
        if (field === 'product_id') {
          const product = products.find(p => p.id === value);
          if (product) {
            updated.description = product.name;
            updated.price = convertAmount(product.unit_price, product.currency || 'USD', currency);
          }
        }
        return updated;
      }
      return item;
    }));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const validateForm = () => {
    if (!clientId) return 'Please select a client';
    if (!estimateNumber) return 'Please enter an estimate number';
    if (items.some(item => !item.description || item.price <= 0)) {
      return 'All items must have a description and price greater than 0';
    }
    return null;
  };

  const handleSave = async () => {
    const errorMsg = validateForm();
    if (errorMsg) return alert(errorMsg);
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to save an estimate');

      const { data: estimate, error: estimateError } = await supabase
        .from('estimates')
        .insert([{
          user_id: user.id,
          client_id: clientId,
          estimate_number: estimateNumber,
          expiry_date: expiryDate || null,
          tax_rate: taxRate,
          total_amount: total,
          currency: currency,
          status: 'draft'
        }])
        .select()
        .single();

      if (estimateError) {
        if (estimateError.code === '23505') throw new Error(`Estimate number ${estimateNumber} already exists. Please use a unique number.`);
        throw estimateError;
      }

      const { error: itemsError } = await supabase
        .from('estimate_items')
        .insert(items.map(item => ({
          estimate_id: estimate.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.price
        })));

      if (itemsError) throw itemsError;

      alert('Estimate saved successfully!');
      router.push('/dashboard/estimates');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 slice-dropdown">
                <label className="text-sm font-medium text-slate-700">Client</label>
                <select
                  ref={clientIdRef}
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  onKeyDown={(e) => handleNext(e as any, estimateNumberRef)}
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Estimate Number"
                ref={estimateNumberRef}
                value={estimateNumber}
                onChange={(e) => setEstimateNumber(e.target.value)}
                onKeyDown={(e) => handleNext(e, expiryDateRef)}
                required
              />
              <Input
                label="Expiry Date (Optional)"
                type="date"
                ref={expiryDateRef}
                value={expiryDate}
                onChange={(e) => {
                  setExpiryDate(e.target.value);
                  if (e.target.value.length === 10) {
                    taxRateRef.current?.focus();
                  }
                }}
                onKeyDown={(e) => handleNext(e, taxRateRef)}
              />
              <Input
                label="Tax Rate (%)"
                ref={taxRateRef}
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                onKeyDown={(e) => handleNext(e, currencyRef)}
              />
              <div className="space-y-1.5 slice-dropdown">
                <label className="text-sm font-medium text-slate-700">Currency</label>
                <select
                  ref={currencyRef}
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {CURRENCIES.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.symbol} - {curr.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Line Items</h2>
              <Button variant="outline" size="sm" onClick={addItem} className="flex items-center gap-2">
                <Plus size={16} /> Add Item
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-medium">Description</th>
                    <th className="px-6 py-3 font-medium w-24">Qty</th>
                    <th className="px-6 py-3 font-medium w-32">Price</th>
                    <th className="px-6 py-3 font-medium w-32">Amount</th>
                    <th className="px-6 py-3 font-medium w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <select 
                            className="text-xs font-bold text-indigo-600 bg-transparent border-none focus:ring-0 p-0 cursor-pointer"
                            value={item.product_id || ''}
                            onChange={(e) => updateItem(item.id, 'product_id', e.target.value)}
                          >
                            <option value="">Custom Item...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.current_stock} in stock)</option>)}
                          </select>
                          <input
                            type="text"
                            className="w-full bg-transparent focus:outline-none text-sm placeholder:text-slate-300"
                            placeholder="Item description..."
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          className="w-full bg-transparent focus:outline-none text-sm"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          className="w-full bg-transparent focus:outline-none text-sm text-right"
                          value={item.price}
                          onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 text-right">
                        {formatCurrency(item.quantity * item.price, currency)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>Tax ({taxRate}%)</span>
                <span>{formatCurrency(taxAmount, currency)}</span>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-indigo-600 text-xl">{formatCurrency(total, currency)}</span>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              <Button className="w-full flex items-center justify-center gap-2" isLoading={loading} onClick={handleSave}>
                <Save size={18} /> Save Estimate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
