'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Bell, Shield, Palette, Save, Upload, Image as ImageIcon, LogOut, CreditCard, LifeBuoy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { performSignOut } from '@/lib/sessionManager';
import { useTranslation } from '@/contexts/LanguageContext';
import { InvoiceDocumentPreview } from '@/components/InvoicePreviewModal';
import type { AssembledInvoice } from '@/utils/invoiceEngine';

export default function SettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    company_name: '',
    phone: '',
    bio: '',
    logo_url: '',
    username: '',
    brand_color: '#6366f1',
    custom_font: 'Inter',
    invoice_template: 'professional_business',
    api_key: '',
    upi_id: '',
    qr_code_enabled: false
  });
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [securityLoading, setSecurityLoading] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || user.email || '',
          company_name: data.company_name || '',
          phone: data.phone || '',
          bio: data.bio || '',
          logo_url: data.logo_url || '',
          username: data.username || '',
          brand_color: data.brand_color || '#6366f1',
          custom_font: data.custom_font || 'Inter',
          invoice_template: data.invoice_template || 'professional_business',
          api_key: data.api_key || '',
          upi_id: data.upi_id || '',
          qr_code_enabled: data.qr_code_enabled || false
        });
      }
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          company_name: profile.company_name,
          phone: profile.phone,
          bio: profile.bio,
          logo_url: profile.logo_url,
          email: profile.email,
          brand_color: profile.brand_color,
          custom_font: profile.custom_font,
          invoice_template: profile.invoice_template,
          upi_id: profile.upi_id,
          qr_code_enabled: profile.qr_code_enabled
        });

      if (error) throw error;
      alert(t('settings.successUpdate') || 'Settings updated successfully!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    setIsGeneratingKey(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const newKey = `yuvr_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      const { error } = await supabase
        .from('profiles')
        .update({ api_key: newKey })
        .eq('id', user.id);

      if (error) throw error;
      
      setProfile({ ...profile, api_key: newKey });
      alert(t('settings.successKey') || 'New API Key generated successfully!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new) {
      alert(t('settings.errorPasswordFill') || 'Please fill in both current and new passwords');
      return;
    }

    if (passwords.new !== passwords.confirm) {
      alert(t('settings.errorPasswordMatch') || 'New passwords do not match');
      return;
    }

    if (passwords.new.length < 6) {
      alert(t('settings.errorPasswordShort') || 'New password must be at least 6 characters');
      return;
    }

    setSecurityLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) throw new Error('Not authenticated');

      // 1. Verify old password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwords.current,
      });

      if (signInError) {
        throw new Error(t('auth.invalidCredentials') || 'Current password is incorrect');
      }

      // 2. Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (updateError) throw updateError;

      alert(t('settings.successPassword') || 'Password updated successfully! You will be signed out from all devices for security.');
      
      // 3. Global Logout
      await performSignOut();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, logo_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'profile', label: t('settings.profile'), icon: User },
    { id: 'branding', label: t('settings.branding'), icon: Palette },
    { id: 'payment', label: t('settings.payment'), icon: CreditCard },
    { id: 'api', label: t('settings.api'), icon: Shield },
    { id: 'security', label: t('settings.security'), icon: Shield },
    { id: 'support', label: t('settings.support'), icon: LifeBuoy },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('settings.title')}</h1>
        <p className="text-slate-500 text-sm">{t('settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <nav className="flex flex-col gap-1">
            {tabs.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <Card className="lg:col-span-3">
          <CardContent className="p-6 space-y-6">
            {activeTab === 'profile' && (
              <>
                <h2 className="text-lg font-bold text-slate-900 border-b pb-4">{t('settings.profileInfo')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    label={t('settings.fullName')} 
                    placeholder="John Doe" 
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  />
                  <Input 
                    label={t('settings.email')} 
                    placeholder="you@example.com" 
                    value={profile.email} 
                    disabled 
                  />
                  <Input 
                    label={t('auth.username')} 
                    placeholder="username" 
                    value={profile.username} 
                    disabled 
                  />
                  <Input 
                    label={t('settings.companyName')} 
                    placeholder="Your Company" 
                    value={profile.company_name}
                    onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                  />
                  <Input 
                    label={t('settings.phone')} 
                    placeholder="+1 (555) 000-0000" 
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">{t('settings.bio')}</label>
                  <textarea 
                    className="flex min-h-[100px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={t('settings.bioPlaceholder')}
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  />
                </div>

                <div className="pt-4 flex justify-start">
                  <Button onClick={handleSaveProfile} isLoading={loading}>
                    <Save size={18} className="mr-2" /> {t('common.save')}
                  </Button>
                </div>
              </>
            )}

            {activeTab === 'branding' && (
              <>
                <h2 className="text-lg font-bold text-slate-900 border-b pb-4">{t('settings.customBranding')}</h2>
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-slate-700">{t('settings.companyLogo')}</label>
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                      {profile.logo_url ? (
                        <div className="relative group/logo">
                          <img src={profile.logo_url} alt="Company Logo" className="max-h-32 rounded-lg shadow-sm" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                            <Button variant="outline" className="bg-white border-none text-slate-900" size="sm" onClick={() => setProfile({ ...profile, logo_url: '' })}>
                              {t('common.delete')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="mx-auto w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                            <ImageIcon size={24} className="text-slate-400" />
                          </div>
                          <p className="text-sm font-medium text-slate-700">{t('settings.uploadLogo')}</p>
                          <p className="text-xs text-slate-500 mt-1">{t('settings.pngJpgMax')}</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={!!profile.logo_url}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-slate-700">{t('settings.brandColor')}</label>
                      <div className="flex items-center gap-4 p-4 border rounded-lg">
                        <input 
                          type="color" 
                          value={profile.brand_color} 
                          onChange={(e) => setProfile({ ...profile, brand_color: e.target.value })}
                          className="h-10 w-20 rounded cursor-pointer"
                        />
                        <code className="bg-slate-100 px-2 py-1 rounded text-sm uppercase">{profile.brand_color}</code>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-sm font-medium text-slate-700">{t('settings.defaultFont')}</label>
                      <select 
                        className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={profile.custom_font}
                        onChange={(e) => setProfile({ ...profile, custom_font: e.target.value })}
                      >
                        {['Inter', 'Roboto', 'Playfair Display', 'Montserrat', 'Open Sans'].map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-medium text-slate-700">{t('settings.invoiceTemplate')}</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                      {[
                        { id: 'professional_business', name: 'Professional' },
                        { id: 'minimal_corporate', name: 'Minimal Corporate' },
                        { id: 'elegant_luxury', name: 'Elegant Luxury' },
                        { id: 'creative_agency', name: 'Creative Agency' },
                        { id: 'tech_startup', name: 'Tech Startup' },
                        { id: 'dark_mode', name: 'Dark Mode' },
                        { id: 'colorful_freelancer', name: 'Colorful' },
                        { id: 'scandinavian_minimal', name: 'Scandinavian' },
                        { id: 'bold_modern', name: 'Bold Modern' },
                        { id: 'premium_finance', name: 'Premium Finance' }
                      ].map(tmp => (
                        <button
                          key={tmp.id}
                          onClick={() => setProfile({ ...profile, invoice_template: tmp.id })}
                          className={`group relative p-3 border rounded-2xl text-center transition-all ${
                            profile.invoice_template === tmp.id 
                              ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-600/10 shadow-lg' 
                              : 'hover:border-slate-300 hover:shadow-md'
                          }`}
                        >
                          <div className={`w-full aspect-[3/4] rounded-xl mb-4 overflow-hidden border shadow-sm transition-transform group-hover:scale-105 ${
                            tmp.id === 'dark_mode' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                          }`}>
                            {/* MINI LAYOUT PREVIEWS */}
                            <div className="p-2 h-full flex flex-col gap-1.5 relative">
                               {/* Special Layout Accents */}
                               {tmp.id === 'creative_agency' && (
                                 <div className="absolute right-0 top-0 w-1/3 h-1/4" style={{ backgroundColor: profile.brand_color }}></div>
                               )}
                               {tmp.id === 'bold_modern' && (
                                 <div className="absolute left-0 top-0 w-2 h-1/3" style={{ backgroundColor: profile.brand_color }}></div>
                               )}
                               {tmp.id === 'tech_startup' && (
                                 <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: profile.brand_color }}></div>
                               )}
                               
                               <div className="flex justify-between items-center mb-1">
                                  <div className="w-4 h-4 rounded-sm bg-slate-100 border border-slate-200"></div>
                                  <div className={`w-8 h-1 rounded-full ${tmp.id === 'dark_mode' ? 'bg-slate-600' : 'bg-slate-200'}`}></div>
                               </div>

                               <div className={`w-full h-1 rounded-full ${tmp.id === 'dark_mode' ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
                               
                               <div className="flex justify-between mt-1">
                                  <div className="flex flex-col gap-1 w-1/2">
                                     <div className={`w-full h-1 rounded-full ${tmp.id === 'dark_mode' ? 'bg-slate-600' : 'bg-slate-200'}`}></div>
                                     <div className={`w-2/3 h-1 rounded-full ${tmp.id === 'dark_mode' ? 'bg-slate-600' : 'bg-slate-200'}`}></div>
                                  </div>
                                  <div className={`w-1/4 h-3 rounded-sm opacity-20`} style={{ backgroundColor: profile.brand_color }}></div>
                               </div>
                               
                               <div className="mt-auto space-y-1">
                                  <div className={`w-full h-4 rounded-md border shadow-sm flex items-center px-1 gap-1 ${
                                    tmp.id === 'dark_mode' ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-100'
                                  }`}>
                                     <div className="w-1/2 h-0.5 bg-indigo-400 opacity-40"></div>
                                     <div className="ml-auto w-1 h-1 rounded-full" style={{ backgroundColor: profile.brand_color }}></div>
                                  </div>
                                  <div className="flex justify-between items-center px-0.5">
                                     <div className={`w-1/3 h-1 rounded-full ${tmp.id === 'dark_mode' ? 'bg-slate-600' : 'bg-slate-200'}`}></div>
                                     <div className="w-1/4 h-1.5 rounded-full" style={{ backgroundColor: profile.brand_color }}></div>
                                  </div>
                               </div>
                            </div>
                          </div>
                          <span className={`text-[11px] font-bold uppercase tracking-tight transition-colors ${
                             profile.invoice_template === tmp.id ? 'text-indigo-600' : 'text-slate-500'
                          }`}>{tmp.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Visual Preview Card */}
                <div className="space-y-4 pt-6 mt-6 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-widest">{t('settings.livePreview')}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                       <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                       {t('settings.realTimeSync') || 'REAL-TIME SYNC'}
                    </div>
                  </div>
                  
                   {/* ─── Live Preview — uses exact same renderer as download/email ─── */}
                   <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60 shadow-inner flex justify-center">
                     {/* A4-proportioned paper (595×842 ratio = 1:1.414) */}
                     <div className="w-full max-w-[540px] overflow-y-auto" style={{ maxHeight: '680px' }}>
                       <InvoiceDocumentPreview
                         invoice={((): AssembledInvoice => ({
                           invoiceNumber: 'INV-2026-0001',
                           date: new Date('2026-03-15'),
                           dueDate: new Date('2026-03-30'),
                           client: {
                             name: 'Global Solutions Inc.',
                             email: 'client@example.com',
                             address: '123 Business Avenue, Innovation Park',
                           },
                           items: [
                             { description: 'Professional Services', quantity: 1, price: 1200 },
                             { description: 'License Fee', quantity: 1, price: 300 },
                           ],
                           taxRate: 10,
                           total: 1650,
                           currency: 'USD',
                           logoUrl: profile.logo_url,
                           companyName: profile.company_name || 'Your Company',
                           companyPhone: (profile as any).phone,
                           brandColor: profile.brand_color,
                           customFont: profile.custom_font,
                           template: profile.invoice_template,
                           _raw: { invoice_number: 'INV-2026-0001', currency: 'USD', tax_rate: 10, total_amount: 1650 },
                         }))()}
                       />
                     </div>
                   </div></div>

                <div className="pt-6 flex justify-start">
                  <Button onClick={handleSaveProfile} isLoading={loading}>
                    <Save size={18} className="mr-2" /> {t('common.save')}
                  </Button>
                </div>
              </>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-900 border-b pb-4">{t('settings.paymentAutomation')}</h2>
                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl space-y-4">
                  <div className="flex items-start gap-4 text-indigo-900">
                    <CreditCard size={24} className="shrink-0" />
                    <div className="space-y-1">
                      <p className="font-semibold">{t('settings.upiTitle')}</p>
                      <p className="text-sm text-indigo-700 opacity-80">{t('settings.upiDesc')}</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-3">
                       <input 
                         type="checkbox" 
                         id="qr_enabled"
                         checked={profile.qr_code_enabled}
                         onChange={(e) => setProfile({ ...profile, qr_code_enabled: e.target.checked })}
                         className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                       />
                       <label htmlFor="qr_enabled" className="text-sm font-semibold text-slate-700 cursor-pointer">{t('settings.qrEnable')}</label>
                    </div>

                    <Input 
                      label={t('settings.upiId')} 
                      placeholder="username@bank (e.g., example@okicici)" 
                      value={profile.upi_id}
                      onChange={(e) => setProfile({ ...profile, upi_id: e.target.value })}
                      disabled={!profile.qr_code_enabled}
                    />
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{t('settings.upiApps')}</p>
                  </div>
                </div>

                <div className="pt-4 flex justify-start">
                  <Button onClick={handleSaveProfile} isLoading={loading}>
                    <Save size={18} className="mr-2" /> {t('settings.savePayment')}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-900 border-b pb-4">{t('settings.api')}</h2>
                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl space-y-4">
                  <div className="flex items-start gap-4 text-indigo-900">
                    <Shield size={24} className="shrink-0" />
                    <div className="space-y-1">
                      <p className="font-semibold">{t('settings.apiKeyTitle')}</p>
                      <p className="text-sm text-indigo-700 opacity-80">{t('settings.apiKeyDesc')}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input 
                        type="password" 
                        readOnly 
                        value={profile.api_key || 'No key generated'} 
                        className="w-full bg-white border border-indigo-200 rounded-lg px-4 py-2.5 font-mono text-sm focus:outline-none placeholder:text-slate-400"
                      />
                      {profile.api_key && (
                        <button 
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 text-xs font-semibold hover:underline"
                          onClick={() => {
                            navigator.clipboard.writeText(profile.api_key);
                            alert(t('settings.copied') || 'API Key copied to clipboard!');
                          }}
                        >
                          {t('settings.copy')}
                        </button>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      className="bg-white" 
                      onClick={generateApiKey}
                      isLoading={isGeneratingKey}
                    >
                      {profile.api_key ? t('settings.regenerate') : t('settings.generateKey')}
                    </Button>
                  </div>
                </div>

                <div className="space-y-6 pt-4 border-t border-slate-100">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-900">1. List Your Clients</h3>
                    <p className="text-sm text-slate-500">Retrieve a list of your clients to get the required <code className="bg-slate-100 px-1 py-0.5 rounded text-xs text-slate-700">client_id</code>.</p>
                    <div className="bg-slate-900 rounded-lg p-4 relative group">
                      <pre className="font-mono text-xs text-slate-300 overflow-x-auto">
{`curl -X GET ${window?.location?.origin || ''}/api/v1/clients \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</pre>
                      <button 
                        onClick={() => navigator.clipboard.writeText(`curl -X GET ${window.location.origin}/api/v1/clients \\\n  -H "Authorization: Bearer YOUR_API_KEY"`)}
                        className="absolute top-2 right-2 p-2 bg-slate-800 rounded text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold"
                      >Copy</button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-900">2. Create an Invoice</h3>
                    <p className="text-sm text-slate-500">Generate a new invoice programmatically. Once created, it will immediately appear in your dashboard.</p>
                    <div className="bg-slate-900 rounded-lg p-4 relative group">
                      <pre className="font-mono text-xs text-slate-300 overflow-x-auto">
{`curl -X POST ${window?.location?.origin || ''}/api/v1/invoices \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "client-uuid-here",
    "invoice_number": "INV-2026-001",
    "currency": "USD",
    "tax_rate": 10,
    "items": [
      {
        "description": "API Integration Services",
        "quantity": 1,
        "price": 500
      }
    ]
}'`}</pre>
                      <button 
                        onClick={() => navigator.clipboard.writeText(`curl -X POST ${window.location.origin}/api/v1/invoices \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "client_id": "client-uuid-here",\n    "invoice_number": "INV-2026-001",\n    "currency": "USD",\n    "tax_rate": 10,\n    "items": [\n      {\n        "description": "API Integration Services",\n        "quantity": 1,\n        "price": 500\n      }\n    ]\n}'`)}
                        className="absolute top-2 right-2 p-2 bg-slate-800 rounded text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold"
                      >Copy</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-900 border-b pb-4">{t('settings.security')}</h2>
                
                <div className="max-w-md space-y-4">
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 flex gap-3 text-amber-700 mb-6">
                    <Shield size={20} className="shrink-0" />
                    <p className="text-sm">{t('settings.securityDesc')}</p>
                  </div>

                  <Input 
                    label={t('settings.currentPassword')} 
                    type="password"
                    placeholder="••••••••" 
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  />
                  <Input 
                    label={t('settings.newPassword')} 
                    type="password"
                    placeholder="••••••••" 
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  />
                  <Input 
                    label={t('settings.confirmPassword')} 
                    type="password"
                    placeholder="••••••••" 
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  />

                  <div className="pt-4">
                    <Button 
                      className="w-full bg-indigo-600 hover:bg-indigo-700" 
                      onClick={handleChangePassword}
                      isLoading={securityLoading}
                    >
                      {t('settings.updatePassword')}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <h2 className="text-lg font-bold text-slate-900">{t('settings.support')}</h2>
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">{t('settings.supportActive') || 'Support Active'}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                       <LifeBuoy size={80} />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-indigo-900 font-bold mb-2">{t('settings.techSupport')}</h3>
                      <p className="text-sm text-indigo-700/80 mb-4">{t('settings.techSupportDesc')}</p>
                      <a href="mailto:jawaharyuvr@gmail.com?subject=Technical Inquiry - Yuvr's" className="text-indigo-600 font-bold text-sm hover:underline flex items-center gap-2">
                        {t('settings.contactTech')}
                      </a>
                    </div>
                  </div>

                  <div className="bg-fuchsia-50 border border-fuchsia-100 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                       <LifeBuoy size={80} />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-fuchsia-900 font-bold mb-2">{t('settings.funcSupport')}</h3>
                      <p className="text-sm text-fuchsia-700/80 mb-4">{t('settings.funcSupportDesc')}</p>
                      <a href="mailto:jawaharyuvr@gmail.com?subject=Functional Inquiry - Yuvr's" className="text-fuchsia-600 font-bold text-sm hover:underline flex items-center gap-2">
                        {t('settings.contactFunc')}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-widest">{t('settings.escalationTitle')}</h3>
                  <div className="space-y-4">
                     <div className="flex items-center gap-4 text-sm">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">1</div>
                        <p className="text-slate-600">{t('settings.responseTime')} <span className="font-bold text-slate-900">24-48 hours</span></p>
                     </div>
                     <div className="flex items-center gap-4 text-sm">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">2</div>
                        <p className="text-slate-600">Priority support for <span className="font-bold text-indigo-600">Pro & Enterprise</span> users: <span className="font-bold text-slate-900">under 6 hours</span></p>
                     </div>
                  </div>
                </div>

                <Card className="bg-slate-50 border-dashed border-2 shadow-none">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-slate-500 mb-4">Need immediate help with a critical bug?</p>
                    <Button variant="outline" className="border-slate-300 hover:bg-white">
                       Join Community Discord
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
