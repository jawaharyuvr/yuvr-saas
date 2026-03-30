'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Download, Eye, Mail, Send, CheckCircle2, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/utils/format';
import { generateInvoicePDF } from '@/utils/pdf';
import { getTaxRateForRegion } from '@/utils/tax';
import { Modal } from '@/components/ui/Modal';
import { CURRENCIES, convertAmount } from '@/utils/constants';
import { getLiveRate } from '@/utils/rateSync';
import { useTranslation } from '@/contexts/LanguageContext';

interface Client {
  id: string;
  name: string;
  email: string;
  address?: string;
  tax_id?: string;
  tax_type?: string;
  region?: string;
}

interface Product {
  id: string;
  name: string;
  unit_price: number;
  currency: string;
  current_stock: number;
}

interface InvoiceItem {
  id: string;
  product_id?: string;
  description: string;
  quantity: number;
  price: number;
}

export default function InvoiceForm() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientId, setClientId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, price: 0 }
  ]);
  const [taxRate, setTaxRate] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [template, setTemplate] = useState<string>('professional_business');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const clientIdRef = React.useRef<HTMLSelectElement>(null);
  const invoiceNumberRef = React.useRef<HTMLInputElement>(null);
  const dueDateRef = React.useRef<HTMLInputElement>(null);
  const taxRateRef = React.useRef<HTMLInputElement>(null);
  const currencyRef = React.useRef<HTMLSelectElement>(null);

  useEffect(() => {
    fetchClients();
    fetchProducts();
    fetchNextInvoiceNumber();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profile) {
      setUserProfile(profile);
      if (profile.invoice_template) setTemplate(profile.invoice_template);
    }
  };

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, name, email, tax_id, tax_type, region');
    if (data) setClients(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('id, name, unit_price, current_stock, currency');
    if (data) setProducts(data);
  };

  const handleNext = (e: React.KeyboardEvent, nextRef: React.RefObject<any>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef.current?.focus();
    }
  };

  useEffect(() => {
    if (clientId) {
      const client = clients.find(c => c.id === clientId);
      if (client?.region) {
        const taxInfo = getTaxRateForRegion(client.region);
        setTaxRate(taxInfo.rate);
      }
    }
  }, [clientId, clients]);

  const fetchNextInvoiceNumber = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const currentYear = new Date().getFullYear();
    const prefix = `INV-${currentYear}-`;
    const { data: allInvoices } = await supabase.from('invoices').select('invoice_number').eq('user_id', user.id).ilike('invoice_number', `${prefix}%`);
    let nextNum = 1;
    if (allInvoices && allInvoices.length > 0) {
      const nums = allInvoices.map(inv => parseInt(inv.invoice_number.split('-').pop() || '0'));
      nextNum = Math.max(...nums) + 1;
    }
    setInvoiceNumber(`${prefix}${nextNum.toString().padStart(4, '0')}`);
  };

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    const val = (field === 'quantity' || field === 'price') ? Number(value) : value;
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: val };
        if (field === 'product_id') {
          const product = products.find(p => p.id === value);
          if (product) {
            updated.description = product.name;
            // Convert price from product's currency to invoice's currency
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

  const handleSave = async () => {
    if (!clientId || !dueDate) return alert('Please fill in all required fields');
    if (items.some(item => !item.description || item.price <= 0)) return alert('Items must have description and price');
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch the LIVE rate at the moment of creation for historical accuracy
      const liveRate = await getLiveRate('USD', currency);

      const { data: invoice, error: invoiceError } = await supabase.from('invoices').insert([{
        user_id: user.id, 
        client_id: clientId, 
        invoice_number: invoiceNumber, 
        due_date: dueDate, 
        tax_rate: taxRate, 
        total_amount: total, 
        currency, 
        exchange_rate: liveRate, // Storing historical rate
        status: 'unpaid'
      }]).select().single();
      
      if (invoiceError) throw invoiceError;

      const { error: itemsError } = await supabase.from('invoice_items').insert(items.map(item => ({
        invoice_id: invoice.id, description: item.description, quantity: item.quantity, unit_price: item.price
      })));
      if (itemsError) throw itemsError;

      // Deduct Stock
      for (const item of items) {
        if (item.product_id) {
          await supabase.rpc('decrement_stock', { p_id: item.product_id, p_qty: item.quantity });
        }
      }

      alert('Invoice saved successfully! Exchange rate for this invoice is locked.');
      
      // Reset form context for next entry
      setClientId('');
      setDueDate('');
      setItems([{ id: crypto.randomUUID(), description: '', quantity: 1, price: 0 }]);
      fetchNextInvoiceNumber();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    const pdfData = { 
      invoiceNumber, date: new Date(), dueDate: new Date(dueDate), 
      client: { name: clients.find(c => c.id === clientId)?.name || 'Client', email: clients.find(c => c.id === clientId)?.email || '' },
      items: items.map(i => ({ description: i.description, quantity: i.quantity, price: i.price })),
      taxRate, total, currency, logoUrl: userProfile?.logo_url, companyName: userProfile?.company_name,
      brandColor: userProfile?.brand_color, customFont: userProfile?.custom_font, template: template,
      upiId: userProfile?.upi_id, qrCodeEnabled: userProfile?.qr_code_enabled
    };
    await generateInvoicePDF(pdfData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardContent className="p-6 grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <label className="text-sm font-medium text-slate-700">{t('sidebar.clients')}</label>
                <select ref={clientIdRef} className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                  <option value="">{t('invoices.selectClient') || 'Select a client'}</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
             <Input label={t('sidebar.invoices')} ref={invoiceNumberRef} value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
             <Input label={t('common.date')} type="date" ref={dueDateRef} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
             <Input label={`${t('invoices.taxRate') || 'Tax Rate'} (%)`} type="number" ref={taxRateRef} value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} />
             <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">{t('common.currency') || 'Currency'}</label>
                <select ref={currencyRef} className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {CURRENCIES.map(curr => <option key={curr.code} value={curr.code}>{curr.symbol} - {curr.name}</option>)}
                </select>
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
               <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                 <Package size={16} /> {t('invoices.lineItems') || 'Line Items'}
               </h2>
               <Button variant="outline" size="sm" onClick={addItem} className="h-8 text-[10px] font-bold uppercase">{t('invoices.addItem') || 'Add Item'}</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[9px] uppercase tracking-widest font-black">
                  <tr>
                    <th className="px-6 py-3">{t('invoices.itemProduct') || 'Item / Product'}</th>
                    <th className="px-6 py-3 w-20">{t('invoices.qty') || 'Qty'}</th>
                    <th className="px-6 py-3 w-32 text-right">{t('invoices.price') || 'Price'}</th>
                    <th className="px-6 py-3 w-32 text-right">{t('invoices.total') || 'Total'}</th>
                    <th className="px-6 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-3">
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
                              className="text-sm bg-transparent border-none focus:ring-0 p-0 w-full placeholder:text-slate-300" 
                              placeholder={t('common.description') || 'Description...'} 
                              value={item.description} 
                              onChange={(e) => updateItem(item.id, 'description', e.target.value)} 
                            />
                         </div>
                      </td>
                      <td className="px-6 py-3"><input type="number" className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-bold" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} /></td>
                      <td className="px-6 py-3 text-right"><input type="number" className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-bold text-right" value={item.price} onChange={(e) => updateItem(item.id, 'price', e.target.value)} /></td>
                      <td className="px-6 py-3 text-sm font-bold text-slate-900 text-right">{formatCurrency(item.quantity * item.price, currency)}</td>
                      <td className="px-6 py-3 text-right"><button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="sticky top-6">
           <CardContent className="p-6 space-y-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 border-b pb-4">{t('invoices.summary') || 'Invoice Summary'}</h2>
              <div className="space-y-3">
                 <div className="flex justify-between text-sm"><span className="text-slate-500">{t('invoices.subtotal') || 'Subtotal'}</span><span className="font-bold text-slate-900">{formatCurrency(subtotal, currency)}</span></div>
                 <div className="flex justify-between text-sm"><span className="text-slate-500">{t('invoices.tax') || 'Tax'} ({taxRate}%)</span><span className="font-bold text-slate-900">{formatCurrency(taxAmount, currency)}</span></div>
                 <div className="pt-4 border-t flex justify-between items-center"><span className="text-xs font-black uppercase text-slate-400">{t('invoices.total') || 'Total'}</span><span className="text-2xl font-black text-indigo-600">{formatCurrency(total, currency)}</span></div>
              </div>
              <div className="pt-6 space-y-3">
                 <Button className="w-full h-12 text-sm font-bold uppercase tracking-widest shadow-lg shadow-indigo-200" onClick={handleSave} isLoading={loading}>{t('invoices.saveInvoice') || 'Save Invoice'}</Button>
                 <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={handleDownload} className="text-[10px] font-black uppercase">{t('invoices.pdf') || 'PDF'}</Button>
                    <Button variant="outline" onClick={() => setIsEmailModalOpen(true)} className="text-[10px] font-black uppercase">{t('invoices.email') || 'Email'}</Button>
                 </div>
              </div>
           </CardContent>
        </Card>
      </div>

      <Modal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} title={t('invoices.sendEmail')}>
         <div className="p-6 space-y-4">
            <Input label={t('invoices.recipient')} value={emailTo} onChange={(e) => setEmailTo(e.target.value)} />
            <Button className="w-full" onClick={() => alert(t('invoices.emailSystemFeature'))}>{t('invoices.sendNow')}</Button>
         </div>
      </Modal>
    </div>
  );
}
