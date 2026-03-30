'use client';

/**
 * InvoicePreviewModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Template-aware HTML invoice preview that matches the PDF output.
 * Used by both dashboard/page.tsx and invoices/page.tsx.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { Download } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate, cn } from '@/utils/format';
import type { AssembledInvoice } from '@/utils/invoiceEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoice: AssembledInvoice | null;
  loading?: boolean;
  onDownload: (inv: AssembledInvoice) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const hexBlend = (hex: string, alpha: number) => {
  const c = hex.replace('#', '');
  if (c.length !== 6) return `rgba(99,102,241,${alpha})`;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

// ── Sub-components ────────────────────────────────────────────────────────────

/** The bill-to + dates + items + totals body — identical for every template */
function InvoiceBody({ inv, brand, textDark, textMid, borderColor, isDark }: {
  inv: AssembledInvoice;
  brand: string;
  textDark: string;
  textMid: string;
  borderColor: string;
  isDark: boolean;
}) {
  const subtotal = inv.items.reduce((s, i) => s + i.quantity * i.price, 0);
  const tax = inv.taxRate > 0 ? subtotal * (inv.taxRate / 100) : 0;

  return (
    <div className="p-6 space-y-5">
      {/* Bill To + Dates */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Bill To</p>
          <p className={`font-bold text-base ${textDark}`}>{inv.client.name}</p>
          <div className={`mt-1.5 space-y-0.5 text-sm ${textMid}`}>
            {inv.client.email && <p>{inv.client.email}</p>}
            {inv.client.address && <p className="italic leading-relaxed">{inv.client.address}</p>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 justify-start pt-1">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice Date</span>
            <span className={textDark}>{formatDate(inv.date)}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Due Date</span>
            <span className="font-bold" style={{ color: brand }}>{formatDate(inv.dueDate)}</span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div>
        <div
          className="flex items-center px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest"
          style={{ backgroundColor: isDark ? '#1e293b' : hexBlend(brand, 0.1), color: isDark ? '#94a3b8' : brand }}
        >
          <span className="flex-1">Description</span>
          <div className="flex text-right gap-6">
            <span className="w-10">Qty</span>
            <span className="w-24">Rate</span>
            <span className="w-28">Amount</span>
          </div>
        </div>
        <div className={`divide-y ${borderColor}`}>
          {inv.items.map((item, idx) => (
            <div key={idx} className="flex items-center px-4 py-3">
              <p className={`flex-1 text-sm font-medium ${textDark}`}>{item.description}</p>
              <div className="flex text-right gap-6 text-sm">
                <span className={`w-10 ${textMid}`}>{item.quantity}</span>
                <span className={`w-24 ${textMid}`}>{formatCurrency(item.price, inv.currency)}</span>
                <span className={`w-28 font-bold ${textDark}`}>{formatCurrency(item.quantity * item.price, inv.currency)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className={`w-72 p-4 rounded-xl space-y-2 ${isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Subtotal</span>
            <span className={textDark}>{formatCurrency(subtotal, inv.currency)}</span>
          </div>
          {inv.taxRate > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Tax ({inv.taxRate}%)</span>
              <span className={textDark}>{formatCurrency(tax, inv.currency)}</span>
            </div>
          )}
          <div className={`pt-2 border-t ${borderColor} flex justify-between items-center`}>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Due</span>
            <span className="text-xl font-black" style={{ color: isDark ? '#fff' : brand }}>
              {formatCurrency(inv.total, inv.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {inv._raw && (
        <div className={`text-xs ${textMid} mt-2 text-center`}>
          Thank you for your business!
        </div>
      )}
    </div>
  );
}

// ── Template Headers ──────────────────────────────────────────────────────────

function ProfessionalBusinessHeader({ inv, brand }: { inv: AssembledInvoice; brand: string }) {
  return (
    <div style={{ backgroundColor: brand }} className="p-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          {inv.logoUrl && (
            <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/20 bg-white/10 flex-shrink-0">
              <img src={inv.logoUrl} className="w-full h-full object-contain" alt="logo" />
            </div>
          )}
          <div>
            <p className="font-bold text-base text-white">{inv.companyName}</p>
            {inv.companyPhone && <p className="text-xs text-white/60 mt-0.5">{inv.companyPhone}</p>}
          </div>
        </div>
        <div className="text-right">
          <h2 className="font-black tracking-[0.15em] text-2xl text-white">INVOICE</h2>
          <p className="mt-0.5 text-sm font-semibold text-white/70">#{inv.invoiceNumber}</p>
        </div>
      </div>
    </div>
  );
}

function MinimalCorporateHeader({ inv, brand }: { inv: AssembledInvoice; brand: string }) {
  return (
    <div className="p-6 border-b border-slate-100">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          {inv.logoUrl && (
            <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-white flex-shrink-0">
              <img src={inv.logoUrl} className="w-full h-full object-contain" alt="logo" />
            </div>
          )}
          <div>
            <p className="font-bold text-base text-slate-900">{inv.companyName}</p>
            {inv.companyPhone && <p className="text-xs text-slate-400 mt-0.5">{inv.companyPhone}</p>}
          </div>
        </div>
        <div className="text-right">
          <h2 className="font-black tracking-[0.15em] text-2xl text-slate-900">INVOICE</h2>
          <p className="mt-0.5 text-sm font-semibold" style={{ color: brand }}>#{inv.invoiceNumber}</p>
        </div>
      </div>
    </div>
  );
}

function ElegantLuxuryHeader({ inv, brand }: { inv: AssembledInvoice; brand: string }) {
  return (
    <div className="p-8 border-2 border-slate-200 mx-4 mt-4 rounded-lg text-center">
      {inv.logoUrl && (
        <div className="w-16 h-16 mx-auto rounded-xl overflow-hidden border border-slate-200 bg-white mb-4">
          <img src={inv.logoUrl} className="w-full h-full object-contain" alt="logo" />
        </div>
      )}
      <h2 className="font-serif font-black text-3xl tracking-widest" style={{ color: brand }}>INVOICE</h2>
      <p className="mt-1 text-sm italic text-slate-400">N° {inv.invoiceNumber}</p>
      <div className="mt-4 border-t border-slate-200 pt-2">
        <p className="text-xs text-slate-400 font-medium">{inv.companyName}</p>
      </div>
    </div>
  );
}

function TechStartupHeader({ inv, brand }: { inv: AssembledInvoice; brand: string }) {
  return (
    <div className="relative p-6" style={{ borderTop: `3px solid ${brand}` }}>
      <div
        className="flex justify-between items-center p-4 rounded-xl"
        style={{ backgroundColor: hexBlend(brand, 0.07) }}
      >
        <div className="flex items-center gap-3">
          {inv.logoUrl && (
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-white flex-shrink-0">
              <img src={inv.logoUrl} className="w-full h-full object-contain" alt="logo" />
            </div>
          )}
          <div>
            <p className="font-bold text-sm text-slate-900" style={{ color: brand }}>{inv.companyName}</p>
            {inv.companyPhone && <p className="text-xs text-slate-400">{inv.companyPhone}</p>}
          </div>
        </div>
        <div className="text-right">
          <h2 className="font-black text-2xl" style={{ color: brand }}>INVOICE</h2>
          <p className="text-xs text-slate-400 mt-0.5">#{inv.invoiceNumber}</p>
        </div>
      </div>
    </div>
  );
}

function DarkModeHeader({ inv, brand }: { inv: AssembledInvoice; brand: string }) {
  return (
    <div className="p-6" style={{ borderTop: `3px solid ${brand}` }}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          {inv.logoUrl && (
            <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/10 bg-white/5 flex-shrink-0">
              <img src={inv.logoUrl} className="w-full h-full object-contain" alt="logo" />
            </div>
          )}
          <div>
            <p className="font-bold text-base" style={{ color: brand }}>{inv.companyName}</p>
            {inv.companyPhone && <p className="text-xs text-slate-400 mt-0.5">{inv.companyPhone}</p>}
          </div>
        </div>
        <div className="text-right">
          <h2 className="font-black text-2xl" style={{ color: brand }}>INVOICE</h2>
          <p className="mt-0.5 text-sm text-slate-400">No. {inv.invoiceNumber}</p>
        </div>
      </div>
    </div>
  );
}

function ColorfulFreelancerHeader({ inv, brand }: { inv: AssembledInvoice; brand: string }) {
  return (
    <div className="p-6" style={{ backgroundColor: '#f59e0b' }}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-black text-2xl text-white">INVOICE</h2>
          <p className="text-white/80 text-sm font-semibold mt-0.5">#{inv.invoiceNumber}</p>
        </div>
        {inv.logoUrl && (
          <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/20 bg-white/10">
            <img src={inv.logoUrl} className="w-full h-full object-contain" alt="logo" />
          </div>
        )}
      </div>
    </div>
  );
}

function ScandinavianHeader({ inv, brand }: { inv: AssembledInvoice; brand: string }) {
  return (
    <div className="p-6 border-b border-slate-100">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          {inv.logoUrl && (
            <div className="w-12 h-12 rounded overflow-hidden border border-slate-100 bg-white flex-shrink-0">
              <img src={inv.logoUrl} className="w-full h-full object-contain" alt="logo" />
            </div>
          )}
          <p className="text-sm text-slate-400">{inv.companyName}</p>
        </div>
        <div className="text-right">
          <h2 className="font-light text-xl tracking-widest text-slate-400">INVOICE</h2>
          <p className="text-xs text-slate-400 mt-0.5">{inv.invoiceNumber}</p>
        </div>
      </div>
    </div>
  );
}

function BoldModernHeader({ inv, brand }: { inv: AssembledInvoice; brand: string }) {
  return (
    <div className="relative overflow-hidden">
      {/* Brand-colored left accent strip — matches PDF drawBoldModern */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: brand }} />
      <div className="bg-[#0f172a] p-6 pl-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {inv.logoUrl && (
            <div className="w-12 h-12 rounded overflow-hidden border border-white/10 bg-white/5 flex-shrink-0">
              <img src={inv.logoUrl} className="w-full h-full object-contain" alt="logo" />
            </div>
          )}
          <h2 className="font-black text-2xl text-white">INVOICE</h2>
        </div>
        <div className="text-right">
          <p className="font-black text-base" style={{ color: brand }}>#{inv.invoiceNumber}</p>
          <p className="text-xs text-slate-400 mt-0.5">{inv.companyName}</p>
        </div>
      </div>
    </div>
  );
}

function PremiumFinanceHeader({ inv, brand }: { inv: AssembledInvoice; brand: string }) {
  return (
    <div>
      <div className="bg-slate-900 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {inv.logoUrl && (
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-white/5 flex-shrink-0">
                <img src={inv.logoUrl} className="w-full h-full object-contain" alt="logo" />
              </div>
            )}
            <div>
              <p className="font-bold text-base text-slate-300">{inv.companyName}</p>
              {inv.companyPhone && <p className="text-xs text-slate-500 mt-0.5">{inv.companyPhone}</p>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="font-serif font-black text-2xl text-white">INVOICE</h2>
            <p className="mt-0.5 text-sm text-slate-400">No. {inv.invoiceNumber}</p>
          </div>
        </div>
      </div>
      <div className="h-1" style={{ backgroundColor: brand }} />
    </div>
  );
}

// ── Creative Agency Layout (sidebar) ─────────────────────────────────────────

function CreativeAgencyLayout({ inv, brand, onDownload, hideActions }: {
  inv: AssembledInvoice;
  brand: string;
  onDownload: () => void;
  hideActions?: boolean;
}) {
  return (
    <div className="flex min-h-0">
      {/* Sidebar */}
      <div className="w-52 flex-shrink-0 p-6 flex flex-col gap-5 text-white min-h-full" style={{ backgroundColor: brand }}>
        {inv.logoUrl ? (
          <div className="w-20 h-20 bg-white/10 rounded-xl flex items-center justify-center overflow-hidden border border-white/20">
            <img src={inv.logoUrl} className="w-full h-full object-contain" alt="logo" />
          </div>
        ) : (
          <div className="w-20 h-16 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
            <span className="text-xs font-black opacity-50">LOGO</span>
          </div>
        )}
        <div className="font-bold text-sm">{inv.companyName}</div>
        <div>
          <div className="text-5xl font-black opacity-30 leading-none">INV</div>
          <div className="text-xs font-bold mt-1 tracking-widest">{inv.invoiceNumber}</div>
        </div>
        <div className="mt-auto space-y-2">
          <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Bill To</p>
          <p className="text-sm font-bold">{inv.client.name}</p>
          <p className="text-xs opacity-70">{inv.client.email}</p>
          {inv.client.address && <p className="text-xs opacity-60 italic">{inv.client.address}</p>}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <InvoiceBody
          inv={inv}
          brand={brand}
          textDark="text-slate-900"
          textMid="text-slate-500"
          borderColor="border-slate-100"
          isDark={false}
        />
        {/* Actions */}
        {!hideActions && (
          <div className="p-5 flex justify-center gap-3 border-t border-slate-100 bg-slate-50 sticky bottom-0">
            <Button onClick={onDownload} className="flex items-center gap-2 px-8">
              <Download size={16} /> Download PDF
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared document renderer (no modal wrapper) ───────────────────────────────
// Used by InvoicePreviewModal AND the Settings live preview.

function renderTemplateHeader(inv: AssembledInvoice, brand: string) {
  const tpl = inv.template || 'professional_business';
  switch (tpl) {
    case 'professional_business': return <ProfessionalBusinessHeader inv={inv} brand={brand} />;
    case 'minimal_corporate':    return <MinimalCorporateHeader inv={inv} brand={brand} />;
    case 'elegant_luxury':       return <ElegantLuxuryHeader inv={inv} brand={brand} />;
    case 'tech_startup':         return <TechStartupHeader inv={inv} brand={brand} />;
    case 'dark_mode':            return <DarkModeHeader inv={inv} brand={brand} />;
    case 'colorful_freelancer':  return <ColorfulFreelancerHeader inv={inv} brand={brand} />;
    case 'scandinavian_minimal': return <ScandinavianHeader inv={inv} brand={brand} />;
    case 'bold_modern':          return <BoldModernHeader inv={inv} brand={brand} />;
    case 'premium_finance':      return <PremiumFinanceHeader inv={inv} brand={brand} />;
    default:                     return <ProfessionalBusinessHeader inv={inv} brand={brand} />;
  }
}

/**
 * InvoiceDocumentPreview
 * Renders a single invoice document (no modal, no download button).
 * Accepts an A4-styled wrapper for the settings live preview.
 */
export function InvoiceDocumentPreview({
  invoice,
  className,
}: {
  invoice: AssembledInvoice;
  className?: string;
}) {
  const brand = invoice.brandColor || '#6366f1';
  const tpl = invoice.template || 'professional_business';
  const isDark = tpl === 'dark_mode';
  const textDark = isDark ? 'text-white' : 'text-slate-900';
  const textMid  = isDark ? 'text-slate-400' : 'text-slate-500';
  const borderColor = isDark ? 'border-slate-700' : 'border-slate-100';
  const containerBg = isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-200';

  if (tpl === 'creative_agency') {
    return (
      <div className={cn('rounded-xl border shadow overflow-hidden', containerBg, className)}>
        <CreativeAgencyLayout inv={invoice} brand={brand} onDownload={() => {}} hideActions />
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border shadow overflow-hidden', containerBg, className)}>
      {renderTemplateHeader(invoice, brand)}
      <InvoiceBody
        inv={invoice}
        brand={brand}
        textDark={textDark}
        textMid={textMid}
        borderColor={borderColor}
        isDark={isDark}
      />
    </div>
  );
}

// ── Main Export (Modal wrapper) ───────────────────────────────────────────────

export function InvoicePreviewModal({ isOpen, onClose, invoice, loading, onDownload }: Props) {
  if (!invoice && !loading) return null;

  const brand = invoice?.brandColor || '#6366f1';
  const tpl = invoice?.template || 'professional_business';
  const isDark = tpl === 'dark_mode';

  const textDark = isDark ? 'text-white' : 'text-slate-900';
  const textMid = isDark ? 'text-slate-400' : 'text-slate-500';
  const borderColor = isDark ? 'border-slate-700' : 'border-slate-100';
  const containerBg = isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-200';

  const handleDownload = () => {
    if (invoice) onDownload(invoice);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invoice Preview" maxWidth="2xl">
      {loading || !invoice ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tpl === 'creative_agency' ? (
        <div className="overflow-y-auto max-h-[82vh]">
          <div className={cn('min-h-[842px] rounded-xl border shadow-2xl mx-auto', containerBg)}
               style={{ minHeight: '842px' }}>
            <CreativeAgencyLayout inv={invoice!} brand={brand} onDownload={handleDownload} />
          </div>
        </div>
      ) : (
        <div className="overflow-y-auto max-h-[82vh]">
          {/* A4 paper: 595×842 CSS px at 72dpi equivalent */}
          <div className={cn('rounded-xl border shadow-2xl mx-auto', containerBg)}
               style={{ minHeight: '842px' }}>
            {renderTemplateHeader(invoice!, brand)}
            <InvoiceBody
              inv={invoice!}
              brand={brand}
              textDark={textDark}
              textMid={textMid}
              borderColor={borderColor}
              isDark={isDark}
            />
            {/* Signature footer — mirrors pdf.ts footer */}
            <div className="mx-6 mb-6 pt-6 border-t border-slate-100 flex justify-between items-end">
              <div>
                <div className="w-32 border-b border-slate-300 mb-1" />
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Authorized Signature</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{invoice!.companyName}</p>
              </div>
              <p className="text-[10px] text-slate-400 italic">Thank you for your business!</p>
            </div>
          </div>
          {/* Actions — outside the paper */}
          <div className={cn(
            'mt-3 flex justify-center gap-3',
          )}>
            <Button onClick={handleDownload} className="flex items-center gap-2 px-8">
              <Download size={16} /> Download PDF
            </Button>
            <Button variant="outline" onClick={onClose} className={isDark ? 'border-slate-600 text-slate-300 bg-transparent' : ''}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
