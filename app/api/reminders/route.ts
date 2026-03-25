import { supabase } from '@/lib/supabase';
import { sendInvoiceEmail } from '@/lib/email';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Get unpaid invoices due today or past due that haven't been reminded
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*, clients(email, name)')
      .eq('status', 'unpaid')
      .lte('due_date', today);

    if (error) throw error;

    const results = [];
    for (const inv of invoices) {
      if (inv.clients?.email) {
        await sendInvoiceEmail(
          inv.clients.email, 
          inv.invoice_number,
          `https://yuvr-saas.com/invoices/${inv.id}` // Example URL
        );
        results.push({ id: inv.id, status: 'sent' });
      }
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
