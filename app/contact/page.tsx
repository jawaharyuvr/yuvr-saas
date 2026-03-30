'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Mail, MessageSquare, Phone, Globe } from 'lucide-react';
import { DynamicBackground } from '@/components/ui/DynamicBackground';
import { useTranslation } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function ContactUs() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      alert(t('contact.alert_fill'));
      return;
    }

    const subject = encodeURIComponent(`Inquiry from ${formData.name}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    );

    window.location.href = `mailto:jawaharyuvr@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <main className="min-h-screen bg-transparent overflow-hidden relative font-sans">
      <DynamicBackground />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="ghost" className="hover:bg-slate-100 transition-colors">
              <ArrowLeft size={18} className="mr-2" /> {t('auth.backToHome')}
            </Button>
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-2xl shadow-indigo-500/10">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">{t('contact.title')}</h1>
          <p className="text-slate-500 mb-12 text-lg">{t('contact.desc')}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm group-hover:scale-110 transition-transform">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{t('contact.email_support')}</h3>
                  <p className="text-slate-500 text-sm mb-2">{t('contact.email_desc')}</p>
                  <a href="mailto:jawaharyuvr@gmail.com?subject=Inquiry from YUVR SaaS" className="text-indigo-600 font-bold hover:underline">
                    {t('contact.contact_btn')}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-fuchsia-50 text-fuchsia-600 rounded-2xl flex items-center justify-center border border-fuchsia-100 shadow-sm group-hover:scale-110 transition-transform">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{t('contact.live_chat')}</h3>
                  <p className="text-slate-500 text-sm mb-2">{t('contact.chat_desc')}</p>
                  <Button size="sm" variant="outline" className="border-fuchsia-200 text-fuchsia-600 hover:bg-fuchsia-50">
                    {t('contact.chat_btn')}
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center border border-cyan-100 shadow-sm group-hover:scale-110 transition-transform">
                  <Globe size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{t('contact.global')}</h3>
                  <p className="text-slate-500 text-sm mb-2">{t('contact.global_desc')}</p>
                  <p className="text-slate-900 font-medium">{t('contact.hq')}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
              <h3 className="text-lg font-bold text-slate-900">{t('contact.send_inquiry')}</h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('auth.fullName')}</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400" 
                    placeholder="John Doe" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('auth.email')}</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400" 
                    placeholder="john@example.com" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('contact.send_inquiry')}</label>
                  <textarea 
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 min-h-[120px]" 
                    placeholder={t('contact.placeholder_msg')}
                  />
                </div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20">
                  {t('contact.submit_btn')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

