/**
 * invoiceEngine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralised invoice-data assembly layer.
 *
 * Every place that needs to generate or display an invoice (download, preview,
 * email) should call `buildInvoiceData` and pass the result straight to
 * `generateInvoicePDF`.  This guarantees that all three operations are always
 * identical and removes scattered, diverging copies of the same logic.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// ── Types ────────────────────────────────────────────────────────────────────

export interface UserBranding {
  logo_url?: string;
  company_name?: string;
  brand_color?: string;
  custom_font?: string;
  invoice_template?: string;
  phone?: string;
  email?: string;
  upi_id?: string;
  qr_code_enabled?: boolean;
}

export interface InvoiceItemRow {
  description: string;
  quantity: number;
  price: number;
}

export interface AssembledInvoice {
  /** Straight pass-through to generateInvoicePDF */
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  client: { name: string; email: string; address?: string; phone?: string };
  items: InvoiceItemRow[];
  taxRate: number;
  total: number;
  currency: string;
  /** Branding */
  logoUrl?: string;
  companyName?: string;
  companyPhone?: string;
  companyEmail?: string;
  brandColor?: string;
  customFont?: string;
  template?: string;
  upiId?: string;
  qrCodeEnabled?: boolean;
  /** For the HTML preview — raw fields not in generateInvoicePDF */
  _raw: {
    invoice_number: string;
    created_at?: string;
    due_date?: string;
    status?: string;
    tax_rate?: number;
    total_amount?: number;
    currency?: string;
    clients?: { name: string; email: string; address?: string } | null;
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Fetches the current user's branding profile from Supabase. */
export const fetchUserBranding = async (
  client: SupabaseClient = supabase,
): Promise<UserBranding | null> => {
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;
  const { data } = await client
    .from('profiles')
    .select(
      'logo_url, company_name, brand_color, custom_font, invoice_template, phone, email, upi_id, qr_code_enabled',
    )
    .eq('id', user.id)
    .single();
  return data ?? null;
};

// ── Core builder ─────────────────────────────────────────────────────────────

/**
 * Assemble a complete invoice payload from the database.
 *
 * @param invoiceId   UUID of the invoice row in `invoices`
 * @param branding    Already-fetched branding object (avoids duplicate DB
 *                    round-trip when the caller already has it).
 *                    If omitted the function fetches it automatically.
 */
export const buildInvoiceData = async (
  invoiceId: string,
  branding?: UserBranding | null,
): Promise<AssembledInvoice | null> => {
  // 1. Fetch invoice + client join
  const { data: inv, error: invErr } = await supabase
    .from('invoices')
    .select(
      'id, invoice_number, total_amount, status, due_date, created_at, currency, tax_rate, clients(name, email, address)',
    )
    .eq('id', invoiceId)
    .single();

  if (invErr || !inv) {
    console.error('[invoiceEngine] fetch invoice error', invErr);
    return null;
  }

  // 2. Fetch line items
  const { data: rawItems } = await supabase
    .from('invoice_items')
    .select('description, quantity, unit_price')
    .eq('invoice_id', invoiceId);

  const items: InvoiceItemRow[] = (rawItems ?? []).map((i) => ({
    description: i.description,
    quantity: i.quantity,
    price: i.unit_price,
  }));

  // 3. Resolve branding
  const profile = branding ?? (await fetchUserBranding());

  // 4. Resolve client (Supabase join returns object or array depending on
  //    cardinality — normalise to object)
  const clientRaw = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients;
  const client = {
    name: clientRaw?.name ?? '',
    email: clientRaw?.email ?? '',
    address: clientRaw?.address ?? '',
  };

  // 5. Determine template — validate against known IDs; fall back to
  //    professional_business so the PDF never silently degrades
  const VALID_TEMPLATES = [
    'professional_business',
    'minimal_corporate',
    'elegant_luxury',
    'creative_agency',
    'tech_startup',
    'dark_mode',
    'colorful_freelancer',
    'scandinavian_minimal',
    'bold_modern',
    'premium_finance',
  ] as const;

  const rawTemplate = profile?.invoice_template ?? '';
  const template = VALID_TEMPLATES.includes(rawTemplate as any)
    ? rawTemplate
    : 'professional_business';

  return {
    invoiceNumber: inv.invoice_number,
    date: inv.created_at ? new Date(inv.created_at) : new Date(),
    dueDate: inv.due_date ? new Date(inv.due_date) : new Date(),
    client,
    items,
    taxRate: inv.tax_rate ?? 0,
    total: inv.total_amount ?? 0,
    currency: inv.currency ?? 'USD',
    logoUrl: profile?.logo_url,
    companyName: profile?.company_name,
    companyPhone: profile?.phone,
    companyEmail: profile?.email,
    brandColor: profile?.brand_color,
    customFont: profile?.custom_font,
    template,
    upiId: profile?.upi_id,
    qrCodeEnabled: profile?.qr_code_enabled,
    _raw: {
      invoice_number: inv.invoice_number,
      created_at: inv.created_at,
      due_date: inv.due_date,
      status: inv.status,
      tax_rate: inv.tax_rate,
      total_amount: inv.total_amount,
      currency: inv.currency,
      clients: clientRaw ?? null,
    },
  };
};

/**
 * Build invoice data from an already-fetched invoice object + items.
 * Used when the caller has already loaded the data (e.g., InvoiceForm preview
 * before the invoice is saved to DB).
 */
export const buildInvoiceDataFromLocal = (
  inv: {
    invoiceNumber: string;
    created_at?: Date | string;
    dueDate: Date | string;
    client: { name: string; email: string; address?: string };
    items: InvoiceItemRow[];
    taxRate: number;
    total: number;
    currency: string;
  },
  branding: UserBranding | null,
): AssembledInvoice => {
  const VALID_TEMPLATES = [
    'professional_business',
    'minimal_corporate',
    'elegant_luxury',
    'creative_agency',
    'tech_startup',
    'dark_mode',
    'colorful_freelancer',
    'scandinavian_minimal',
    'bold_modern',
    'premium_finance',
  ] as const;

  const rawTemplate = branding?.invoice_template ?? '';
  const template = VALID_TEMPLATES.includes(rawTemplate as any)
    ? rawTemplate
    : 'professional_business';

  return {
    invoiceNumber: inv.invoiceNumber,
    date: inv.created_at ? new Date(inv.created_at) : new Date(),
    dueDate: new Date(inv.dueDate),
    client: inv.client,
    items: inv.items,
    taxRate: inv.taxRate,
    total: inv.total,
    currency: inv.currency,
    logoUrl: branding?.logo_url,
    companyName: branding?.company_name,
    companyPhone: branding?.phone,
    companyEmail: branding?.email,
    brandColor: branding?.brand_color,
    customFont: branding?.custom_font,
    template,
    upiId: branding?.upi_id,
    qrCodeEnabled: branding?.qr_code_enabled,
    _raw: {
      invoice_number: inv.invoiceNumber,
      currency: inv.currency,
      tax_rate: inv.taxRate,
      total_amount: inv.total,
    },
  };
};
