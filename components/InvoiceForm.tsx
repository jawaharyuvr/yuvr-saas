'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Download, Eye, Mail, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/utils/format';
import { generateInvoicePDF } from '@/utils/pdf';
import { getTaxRateForRegion } from '@/utils/tax';
import { Modal } from '@/components/ui/Modal';
import { CURRENCIES } from '@/utils/constants';


interface Client {
  id: string;
  name: string;
  email: string;
  address?: string;
  tax_id?: string;
  tax_type?: string;
  region?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export default function InvoiceForm() {
  const [clients, setClients] = useState<Client[]>([]);
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

  // Refs for focus management
  const clientIdRef = React.useRef<HTMLSelectElement>(null);
  const invoiceNumberRef = React.useRef<HTMLInputElement>(null);
  const dueDateRef = React.useRef<HTMLInputElement>(null);
  const taxRateRef = React.useRef<HTMLInputElement>(null);
  const currencyRef = React.useRef<HTMLSelectElement>(null);

  useEffect(() => {
    fetchClients();
    fetchNextInvoiceNumber();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profile) {
      setUserProfile(profile);
      if (profile.invoice_template) {
        setTemplate(profile.invoice_template);
      }
    }
  };

  const handleNext = (e: React.KeyboardEvent, nextRef: React.RefObject<any>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef.current?.focus();
    }
  };

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, name, email, tax_id, tax_type, region');
    if (data) setClients(data);
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

    const { data: allInvoices } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', user.id)
      .ilike('invoice_number', `${prefix}%`);
    
    let nextNum = 1;
    if (allInvoices && allInvoices.length > 0) {
      const nums = allInvoices.map(inv => {
        const parts = inv.invoice_number.split('-');
        return parseInt(parts[parts.length - 1] || '0');
      });
      nextNum = Math.max(...nums) + 1;
    }
    
    setInvoiceNumber(`${prefix}${nextNum.toString().padStart(4, '0')}`);
  };

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    // Stripping leading zeros
    const val = (field === 'quantity' || field === 'price') ? Number(value) : value;
    setItems(items.map(item => item.id === id ? { ...item, [field]: val } : item));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const getInvoiceData = async () => {
    const { data: profile } = await supabase.from('profiles').select('*').single();
    const selectedClient = clients.find(c => c.id === clientId);
    
    return {
      invoiceNumber,
      date: new Date(),
      dueDate: new Date(dueDate),
      client: {
        name: selectedClient?.name || 'Unknown Client',
        email: selectedClient?.email || '',
        address: selectedClient?.address || '',
      },
      items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        price: item.price,
      })),
      taxRate,
      total,
      currency,
      brandColor: profile?.brand_color,
      customFont: profile?.custom_font,
      logoUrl: profile?.logo_url,
      companyName: profile?.company_name,
      template: template
    };
  };

  const validateForm = () => {
    if (!clientId) return 'Please select a client';
    if (!dueDate) return 'Please select a due date';
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
      if (!user) throw new Error('You must be logged in to save an invoice');

      // 1. Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
          user_id: user.id,
          client_id: clientId,
          invoice_number: invoiceNumber,
          due_date: dueDate,
          tax_rate: taxRate,
          total_amount: total,
          currency: currency,
          status: 'unpaid'
        }])
        .select()
        .single();

      if (invoiceError) {
        if (invoiceError.code === '23505') throw new Error(`Invoice number ${invoiceNumber} already exists. Please use a unique number.`);
        throw invoiceError;
      }

      // 2. Create invoice items
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(items.map(item => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.price
        })));

      if (itemsError) throw itemsError;

      alert('Invoice saved successfully!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    const errorMsg = validateForm();
    if (errorMsg) return alert(errorMsg);
    const data = await getInvoiceData();
    generateInvoicePDF(data);
  };

  const handlePreview = () => {
    const errorMsg = validateForm();
    if (errorMsg) return alert(errorMsg);
    setIsPreviewOpen(true);
  };

  const handleOpenEmailModal = () => {
    const errorMsg = validateForm();
    if (errorMsg) return alert(errorMsg);
    const selectedClient = clients.find(c => c.id === clientId);
    setEmailTo(selectedClient?.email || '');
    setEmailSent(false);
    setIsEmailModalOpen(true);
  };

  const sendEmail = async () => {
    if (!emailTo || !emailTo.includes('@')) {
      return alert('Please enter a valid email address');
    }
    setEmailSending(true);
    try {
      const data = await getInvoiceData();
      const pdfBase64 = generateInvoicePDF(data, true);

      const res = await fetch('/api/v1/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          to: emailTo, 
          invoiceNumber, 
          pdfBase64,
          brandColor: userProfile?.brand_color,
          logoUrl: userProfile?.logo_url,
          companyName: userProfile?.company_name,
          totalAmount: total,
          currency: currency
        }),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || 'Failed to send email');
      setEmailSent(true);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Client</label>
                <select
                  ref={clientIdRef}
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  onKeyDown={(e) => handleNext(e as any, invoiceNumberRef)}
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Invoice Number"
                ref={invoiceNumberRef}
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                onKeyDown={(e) => handleNext(e, dueDateRef)}
                required
              />
              <Input
                label="Due Date"
                type="date"
                ref={dueDateRef}
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  if (e.target.value.length === 10) {
                    taxRateRef.current?.focus();
                  }
                }}
                onKeyDown={(e) => handleNext(e, taxRateRef)}
                required
              />
              <Input
                label="Tax Rate (%)"
                type="number"
                ref={taxRateRef}
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                onFocus={(e) => { if (taxRate === 0) setTaxRate('' as any); }}
                onBlur={(e) => { if (taxRate as any === '') setTaxRate(0); }}
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
                    <tr key={item.id} className="group">
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          className="w-full bg-transparent focus:outline-none text-sm"
                          placeholder="Item description..."
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        />
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
                <Save size={18} /> Save Invoice
              </Button>
              <div className="grid grid-cols-3 gap-3">
                <Button variant="outline" className="flex items-center justify-center gap-2" onClick={handlePreview}>
                  <Eye size={18} /> Preview
                </Button>
                <Button variant="outline" className="flex items-center justify-center gap-2" onClick={handleDownload}>
                  <Download size={18} /> PDF
                </Button>
                <Button variant="outline" className="flex items-center justify-center gap-2" onClick={handleOpenEmailModal}>
                  <Mail size={18} /> Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Modal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        title="Invoice Preview"
        maxWidth="2xl"
      >
        <div className="space-y-8 p-4">
          <div className="flex justify-between items-start">
            <div>
                <div className={`flex ${
                  template === 'elegant_luxury' ? 'flex-col items-center text-center' : 'justify-between items-start'
                } ${template === 'bold_modern' ? 'pl-4' : ''}`}>
                   <div className="space-y-4">
                     <div className="w-24 h-24 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-300 text-xs overflow-hidden">
                       {userProfile?.logo_url ? <img src={userProfile.logo_url} className="w-full h-full object-contain" /> : 'LOGO'}
                     </div>
                     {template === 'tech_startup' && (
                       <p className="text-lg font-bold text-slate-900" style={{ color: userProfile?.brand_color }}>{userProfile?.company_name || 'Your Company'}</p>
                     )}
                   </div>
                   
                   <div className={template === 'elegant_luxury' ? 'mt-6' : 'text-right'}>
                     <h4 className={`font-black text-[28px] leading-none tracking-tighter ${
                       template === 'dark_mode' ? 'text-white' : 
                       template === 'elegant_luxury' ? 'tracking-[0.3em] text-slate-800' : 'text-slate-900'
                     }`} style={{ 
                       color: (template === 'bold_modern' || template === 'creative_agency') ? userProfile?.brand_color : undefined 
                     }}>INVOICE</h4>
                     <p className="text-slate-400 font-bold mt-2 uppercase tracking-tight text-sm">#{invoiceNumber || 'INV-001'}</p>
                   </div>
                </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">Bill To:</p>
              <p className="text-sm text-slate-600">
                {clients.find(c => c.id === clientId)?.name || 'Unknown Client'}
              </p>
              <p className="text-sm text-slate-500">
                {clients.find(c => c.id === clientId)?.email || ''}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Invoice Date</p>
              <p className="font-medium">{formatDate(new Date())}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500">Due Date</p>
              <p className="font-medium">{formatDate(dueDate)}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="py-2 text-left font-medium">Description</th>
                  <th className="py-2 text-right font-medium">Qty</th>
                  <th className="py-2 text-right font-medium">Price</th>
                  <th className="py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 text-slate-900">{item.description}</td>
                    <td className="py-3 text-right text-slate-600">{item.quantity}</td>
                    <td className="py-3 text-right text-slate-600">{formatCurrency(item.price, currency)}</td>
                    <td className="py-3 text-right font-medium text-slate-900">
                      {formatCurrency(item.quantity * item.price, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 pt-6 flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>Tax ({taxRate}%)</span>
                <span>{formatCurrency(taxAmount, currency)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total</span>
                <span className="text-indigo-600">{formatCurrency(total, currency)}</span>
              </div>
            </div>
          </div>

          <div className="pt-8 flex justify-center gap-4">
            <Button onClick={handleDownload} className="flex items-center gap-2">
              <Download size={18} /> Download PDF
            </Button>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

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
                Invoice <span className="font-medium">{invoiceNumber}</span> has been sent to{' '}
                <span className="font-medium">{emailTo}</span>
              </p>
            </div>
            <Button variant="outline" onClick={() => setIsEmailModalOpen(false)} className="mt-2">
              Close
            </Button>
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
              <p className="text-xs text-slate-400">Pre-filled from the selected client. You can edit it.</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sending</p>
              <p className="text-sm font-semibold text-slate-900">Invoice {invoiceNumber}</p>
              <p className="text-sm text-slate-500">Total: <span className="font-medium text-slate-900">{formatCurrency(total, currency)}</span></p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsEmailModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 flex items-center justify-center gap-2"
                onClick={sendEmail}
                isLoading={emailSending}
              >
                <Send size={16} /> Send Email
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
