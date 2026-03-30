'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { DynamicBackground } from '@/components/ui/DynamicBackground';
import { useTranslation } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function PrivacyPolicy() {
  const { t } = useTranslation();
  
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
          <h1 className="text-4xl font-extrabold text-slate-900 mb-8 tracking-tight">{t('legal.privacy')}</h1>
          
          <div className="prose prose-slate max-w-none space-y-6 text-slate-600 leading-relaxed">
            <p className="text-sm font-medium text-slate-400">{t('legal.last_updated')}</p>
            
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 pt-4">{t('legal.p1_title')}</h2>
              <p>{t('legal.p1_content')}</p>
            </section>
            
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 pt-4">{t('legal.p2_title')}</h2>
              <p>{t('legal.p2_content')}</p>
            </section>
            
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 pt-4">{t('legal.p3_title')}</h2>
              <p>{t('legal.p3_content')}</p>
            </section>
            
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 pt-4">{t('legal.p4_title')}</h2>
              <p>{t('legal.p4_content')}</p>
            </section>
            
            <section className="space-y-3 border-t border-slate-100 pt-8 mt-8">
              <h2 className="text-xl font-bold text-slate-900">{t('contact.title')}</h2>
              <p>{t('legal.contact_text')} <a href="mailto:jawaharyuvr@gmail.com" className="text-indigo-600 hover:underline">jawaharyuvr@gmail.com</a></p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

