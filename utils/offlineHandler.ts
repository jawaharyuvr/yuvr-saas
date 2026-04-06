import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';

export const isOnline = () => {
  return typeof window !== 'undefined' && window.navigator.onLine;
};

export async function saveInvoice(invoice: any, items: any[]) {
  if (isOnline()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: newInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{ ...invoice, user_id: user.id }])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(items.map(item => ({ ...item, invoice_id: newInvoice.id })));

      if (itemsError) throw itemsError;

      return { success: true, data: newInvoice };
    } catch (error: any) {
      console.error('Online save failed, falling back to offline:', error);
    }
  }

  // Offline Save - Ensure DB is open and wrap in try-catch
  try {
    if (!db.isOpen()) await db.open();
    
    await db.invoices.add({
      ...invoice,
      items,
      synced: false,
      created_at: new Date().toISOString()
    });

    return { success: true, offline: true };
  } catch (dbError: any) {
    console.error('Dexie offline save failed:', dbError);
    if (dbError.name === 'AbortError' || dbError.message.includes('stolen')) {
      // If lock was stolen, we might need to re-open or the singleton fix will handle it on next tick
      console.warn('Database lock issue detected, retrying after re-open...');
      await db.close();
      await db.open();
    }
    return { success: false, error: dbError.message };
  }
}

export async function syncOfflineData() {
  if (!isOnline()) return;

  try {
    if (!db.isOpen()) await db.open();
    
    const unsyncedInvoices = await db.invoices.where('synced').equals(0).toArray();
    
    for (const inv of unsyncedInvoices) {
      try {
        const { items, id, ...invoiceData } = inv as any;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) continue;

        const { data: newInvoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert([{ ...invoiceData, user_id: user.id }])
          .select()
          .single();

        if (!invoiceError) {
          await supabase
            .from('invoice_items')
            .insert(items.map((item: any) => ({ ...item, invoice_id: newInvoice.id })));
          
          await db.invoices.update(id, { synced: true });
        }
      } catch (error) {
        console.error('Sync failed for invoice:', inv.invoice_number, error);
      }
    }
  } catch (globalDbError) {
    console.error('Sync process failed due to database error:', globalDbError);
  }
}
