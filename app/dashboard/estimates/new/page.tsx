'use client';

import React from 'react';
import EstimateForm from '@/components/EstimateForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewEstimatePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/estimates"
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Estimate / Quote</h1>
          <p className="text-slate-500 text-sm">Create a professional quote for your client.</p>
        </div>
      </div>

      <EstimateForm />
    </div>
  );
}
