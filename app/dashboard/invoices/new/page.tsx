'use client';

import React from 'react';
import InvoiceForm from '@/components/InvoiceForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/contexts/LanguageContext';
import { PageTransition } from '@/components/ui/PageTransition';

export default function NewInvoicePage() {
  const { t } = useTranslation();
  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('invoices.newInvoice')}</h1>
            <p className="text-slate-500 text-sm">{t('invoices.newInvoiceSubtitle')}</p>
          </div>
        </div>

        <InvoiceForm />
      </div>
    </PageTransition>
  );
}
