'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Bell, Shield, Palette, Save, Upload, Image as ImageIcon, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { clearLocalSession } from '@/lib/sessionManager';

export default function SettingsPage() {
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
    invoice_template: 'modern',
    api_key: ''
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
          invoice_template: data.invoice_template || 'modern',
          api_key: data.api_key || ''
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
          invoice_template: profile.invoice_template
        });

      if (error) throw error;
      alert('Settings updated successfully!');
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
      alert('New API Key generated successfully!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new) {
      alert('Please fill in both current and new passwords');
      return;
    }

    if (passwords.new !== passwords.confirm) {
      alert('New passwords do not match');
      return;
    }

    if (passwords.new.length < 6) {
      alert('New password must be at least 6 characters');
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
        throw new Error('Current password is incorrect');
      }

      // 2. Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (updateError) throw updateError;

      alert('Password updated successfully! You will be signed out from all devices for security.');
      
      // 3. Global Logout
      await supabase.auth.signOut({ scope: 'global' });
      clearLocalSession();
      router.replace('/login');
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
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'api', label: 'API Access', icon: Shield },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm">Manage your profile and account preferences.</p>
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
                <h2 className="text-lg font-bold text-slate-900 border-b pb-4">Profile Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    label="Full Name" 
                    placeholder="John Doe" 
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  />
                  <Input 
                    label="Email Address" 
                    placeholder="you@example.com" 
                    value={profile.email} 
                    disabled 
                  />
                  <Input 
                    label="Username" 
                    placeholder="username" 
                    value={profile.username} 
                    disabled 
                  />
                  <Input 
                    label="Company Name" 
                    placeholder="Your Company" 
                    value={profile.company_name}
                    onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                  />
                  <Input 
                    label="Phone Number" 
                    placeholder="+1 (555) 000-0000" 
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Bio</label>
                  <textarea 
                    className="flex min-h-[100px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Tell us a little about yourself..."
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button onClick={handleSaveProfile} isLoading={loading}>
                    <Save size={18} className="mr-2" /> Save Changes
                  </Button>
                </div>
              </>
            )}

            {activeTab === 'branding' && (
              <>
                <h2 className="text-lg font-bold text-slate-900 border-b pb-4">Custom Branding</h2>
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-slate-700">Company Logo</label>
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                      {profile.logo_url ? (
                        <div className="relative group/logo">
                          <img src={profile.logo_url} alt="Company Logo" className="max-h-32 rounded-lg shadow-sm" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                            <Button variant="outline" className="bg-white border-none text-slate-900" size="sm" onClick={() => setProfile({ ...profile, logo_url: '' })}>
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="mx-auto w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                            <ImageIcon size={24} className="text-slate-400" />
                          </div>
                          <p className="text-sm font-medium text-slate-700">Upload Company Logo</p>
                          <p className="text-xs text-slate-500 mt-1">PNG, JPG or SVG (max. 1MB)</p>
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
                      <label className="text-sm font-medium text-slate-700">Brand Color</label>
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
                      <label className="text-sm font-medium text-slate-700">Default Font</label>
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
                    <label className="text-sm font-medium text-slate-700">Invoice Template</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                      {[
                        { id: 'professional_business', name: 'Professional' },
                        { id: 'minimal_corporate', name: 'Corporate' },
                        { id: 'elegant_luxury', name: 'Luxury' },
                        { id: 'creative_agency', name: 'Agency' },
                        { id: 'tech_startup', name: 'Startup' },
                        { id: 'dark_mode', name: 'Dark Mode' },
                        { id: 'colorful_freelancer', name: 'Freelancer' },
                        { id: 'scandinavian_minimal', name: 'Scandinavian' },
                        { id: 'bold_modern', name: 'Bold' },
                        { id: 'premium_finance', name: 'Finance' }
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
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-widest">Live Preview</h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                       <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                       REAL-TIME SYNC
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60 shadow-inner flex justify-center">
                    <div className={`w-full max-w-[420px] rounded-lg shadow-2xl overflow-hidden text-[9px] border transition-all duration-500 scale-90 md:scale-100 relative ${
                      profile.invoice_template === 'dark_mode' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                    }`}>
                      
                      {/* LAYOUT-SPECIFIC ACCENTS */}
                      {profile.invoice_template === 'creative_agency' && (
                        <div className="absolute right-0 top-0 w-32 h-32 opacity-20 -mr-16 -mt-16 rounded-full" style={{ backgroundColor: profile.brand_color }}></div>
                      )}
                      {profile.invoice_template === 'bold_modern' && (
                        <div className="absolute left-0 top-0 w-3 h-32" style={{ backgroundColor: profile.brand_color }}></div>
                      )}
                      {profile.invoice_template === 'tech_startup' && (
                        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: profile.brand_color }}></div>
                      )}
                      {profile.invoice_template === 'premium_finance' && (
                        <div className="absolute top-0 left-0 bottom-0 w-px bg-slate-200" style={{ boxShadow: `2px 0 0 ${profile.brand_color}` }}></div>
                      )}

                      <div className="p-6 space-y-6 relative" style={{ fontFamily: profile.custom_font === 'Inter' ? 'Inter, sans-serif' : profile.custom_font }}>
                        
                        {/* HEADER SECTION */}
                        <div className={`flex ${
                          profile.invoice_template === 'elegant_luxury' ? 'flex-col items-center text-center' : 'justify-between items-start'
                        } ${profile.invoice_template === 'bold_modern' ? 'pl-4' : ''}`}>
                           <div className="space-y-2">
                             <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-[8px] text-slate-400 font-bold border-2 border-dashed border-slate-200 overflow-hidden">
                               {profile.logo_url ? <img src={profile.logo_url} className="w-full h-full object-contain" /> : 'LOGO'}
                             </div>
                             {profile.invoice_template === 'tech_startup' && (
                               <p className="font-bold text-slate-900" style={{ color: profile.brand_color }}>{profile.company_name || 'Your Company'}</p>
                             )}
                           </div>
                           
                           <div className={profile.invoice_template === 'elegant_luxury' ? 'mt-4' : 'text-right'}>
                             <h4 className={`font-black text-[14px] leading-none ${
                               profile.invoice_template === 'dark_mode' ? 'text-white' : 
                               profile.invoice_template === 'elegant_luxury' ? 'tracking-[0.2em] text-slate-800' : 'text-slate-900'
                             }`} style={{ 
                               color: (profile.invoice_template === 'bold_modern' || profile.invoice_template === 'creative_agency') ? profile.brand_color : undefined 
                             }}>INVOICE</h4>
                             <p className="text-slate-400 font-bold mt-1 uppercase tracking-tighter">#{profile.invoice_template === 'dark_mode' ? 'DK' : 'INV'}-2026-0001</p>
                           </div>
                        </div>

                        {/* BILLING AND INFO GRID */}
                        <div className={`grid grid-cols-2 gap-4 pt-4 border-t ${
                          profile.invoice_template === 'dark_mode' ? 'border-slate-700' : 'border-slate-50'
                        }`}>
                           <div className="space-y-1">
                              <p className="font-bold text-slate-400 uppercase text-[7px] tracking-widest">Bill To</p>
                              <p className={`font-bold text-[10px] ${profile.invoice_template === 'dark_mode' ? 'text-white' : 'text-slate-900'}`}>Global Solutions Inc.</p>
                              <p className="text-slate-500 leading-relaxed">123 Business Avenue<br/>Innovation Park, CA 94107</p>
                           </div>
                           <div className="text-right space-y-1">
                              <div className="flex justify-between pl-8">
                                <span className="text-slate-400 font-bold uppercase text-[7px] tracking-widest">Date</span>
                                <span className={profile.invoice_template === 'dark_mode' ? 'text-slate-200' : 'text-slate-700'}>Mar 15, 2026</span>
                              </div>
                              <div className="flex justify-between pl-8">
                                <span className="text-slate-400 font-bold uppercase text-[7px] tracking-widest">Due</span>
                                <span className="font-bold" style={{ color: profile.brand_color }}>Mar 30, 2026</span>
                              </div>
                           </div>
                        </div>

                        {/* ITEMS PREVIEW */}
                        <div className="space-y-3">
                           <div className={`flex justify-between py-2 px-3 items-center rounded-md font-bold text-[7.5px] uppercase tracking-widest ${
                             profile.invoice_template === 'dark_mode' ? 'bg-slate-700/50 text-slate-300' : 
                             (profile.invoice_template === 'scandinavian_minimal' ? 'bg-white border-b border-slate-100 text-slate-400' : 'bg-slate-50 text-slate-500')
                           }`} style={{ 
                             backgroundColor: (profile.invoice_template !== 'scandinavian_minimal' && profile.invoice_template !== 'dark_mode') ? `${profile.brand_color}10` : undefined,
                             color: (profile.invoice_template !== 'scandinavian_minimal' && profile.invoice_template !== 'dark_mode') ? profile.brand_color : undefined
                           }}>
                              <span>Description</span>
                              <div className="flex gap-6">
                                <span>Qty</span>
                                <span>Total</span>
                              </div>
                           </div>
                           
                           <div className="space-y-2.5 px-3">
                              <div className="flex justify-between items-center group">
                                 <div className="space-y-0.5">
                                    <p className={`font-bold ${profile.invoice_template === 'dark_mode' ? 'text-white' : 'text-slate-800'}`}>Professional Services</p>
                                    <p className="text-slate-400 text-[8px]">Development and Consultation</p>
                                 </div>
                                 <div className="flex gap-8 font-bold">
                                    <span className="text-slate-400">01</span>
                                    <span className={profile.invoice_template === 'dark_mode' ? 'text-slate-200' : 'text-slate-900'}>$1,200.00</span>
                                 </div>
                              </div>
                              <div className={`h-px w-full ${profile.invoice_template === 'dark_mode' ? 'bg-slate-700' : 'bg-slate-50'}`}></div>
                              <div className="flex justify-between items-center">
                                 <div className="space-y-0.5">
                                    <p className={`font-bold ${profile.invoice_template === 'dark_mode' ? 'text-white' : 'text-slate-800'}`}>License Fee</p>
                                    <p className="text-slate-400 text-[8px]">Annual SaaS Subscription</p>
                                 </div>
                                 <div className="flex gap-8 font-bold">
                                    <span className="text-slate-400">01</span>
                                    <span className={profile.invoice_template === 'dark_mode' ? 'text-slate-200' : 'text-slate-900'}>$300.00</span>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* TOTALS SUMMARY */}
                        <div className="flex justify-end pt-4">
                           <div className="w-1/2 space-y-2">
                              <div className="flex justify-between text-slate-400 font-bold uppercase text-[7px]">
                                 <span>Subtotal</span>
                                 <span className={profile.invoice_template === 'dark_mode' ? 'text-slate-300' : 'text-slate-700'}>$1,500.00</span>
                              </div>
                              <div className="flex justify-between text-slate-400 font-bold uppercase text-[7px]">
                                 <span>Tax (10%)</span>
                                 <span className={profile.invoice_template === 'dark_mode' ? 'text-slate-300' : 'text-slate-700'}>$150.00</span>
                              </div>
                              <div className="h-px bg-slate-100 mt-2"></div>
                              <div className="flex justify-between items-center pt-1">
                                 <span className="font-black text-[10px]" style={{ color: profile.invoice_template === 'dark_mode' ? '#fff' : profile.brand_color }}>TOTAL</span>
                                 <span className="font-black text-[12px]" style={{ color: profile.invoice_template === 'dark_mode' ? '#fff' : profile.brand_color }}>$1,650.00</span>
                              </div>
                           </div>
                        </div>

                        {/* SIGNATURE SECTION */}
                        <div className="pt-8 flex justify-between items-end">
                           <div className="space-y-4">
                              <div className="w-24 h-6 border-b border-slate-300 opacity-30"></div>
                              <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">Authorized Signature</p>
                           </div>
                           <p className="text-[7px] text-slate-400 font-medium italic">Thank you for your business!</p>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <Button onClick={handleSaveProfile} isLoading={loading}>
                    <Save size={18} className="mr-2" /> Save Branding
                  </Button>
                </div>
              </>
            )}

            {activeTab === 'api' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-900 border-b pb-4">API Access</h2>
                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl space-y-4">
                  <div className="flex items-start gap-4 text-indigo-900">
                    <Shield size={24} className="shrink-0" />
                    <div className="space-y-1">
                      <p className="font-semibold">Your Private API Key</p>
                      <p className="text-sm text-indigo-700 opacity-80">Use this key to integrate Yuvr-SaaS with your existing applications. Keep it secure!</p>
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
                            alert('API Key copied to clipboard!');
                          }}
                        >
                          Copy
                        </button>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      className="bg-white" 
                      onClick={generateApiKey}
                      isLoading={isGeneratingKey}
                    >
                      {profile.api_key ? 'Regenerate' : 'Generate Key'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-6 pt-4 border-t border-slate-100">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-900">1. List Your Clients</h3>
                    <p className="text-sm text-slate-500">Retrieve a list of your clients to get the required <code className="bg-slate-100 px-1 py-0.5 rounded text-xs text-slate-700">client_id</code>.</p>
                    <div className="bg-slate-900 rounded-lg p-4 relative group">
                      <pre className="font-mono text-xs text-slate-300 overflow-x-auto">
{`curl -X GET ${window.location.origin}/api/v1/clients \\
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
{`curl -X POST ${window.location.origin}/api/v1/invoices \\
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
                <h2 className="text-lg font-bold text-slate-900 border-b pb-4">Security Settings</h2>
                
                <div className="max-w-md space-y-4">
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 flex gap-3 text-amber-700 mb-6">
                    <Shield size={20} className="shrink-0" />
                    <p className="text-sm">Keep your account secure by using a strong password. You will need to re-verify your current password to make changes.</p>
                  </div>

                  <Input 
                    label="Current Password" 
                    type="password"
                    placeholder="••••••••" 
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  />
                  <Input 
                    label="New Password" 
                    type="password"
                    placeholder="••••••••" 
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  />
                  <Input 
                    label="Confirm New Password" 
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
                      Update Password
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
