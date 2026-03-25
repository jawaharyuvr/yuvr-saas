import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { generateInvoicePDF } from '@/utils/pdf';
import { sendInvoiceEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = authHeader.split(' ')[1];
    
    // 1. Find profile by API key
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('api_key', apiKey)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    }

    const body = await req.json();
    const { client_id, invoice_number, items, tax_rate, currency } = body;

    // 2. Create invoice
    const total_amount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0) * (1 + (tax_rate || 0)/100);

    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert([{
        user_id: profile.id,
        client_id,
        invoice_number,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tax_rate: tax_rate || 0,
        total_amount,
        currency: currency || 'USD',
        status: 'unpaid'
      }])
      .select()
      .single();

    if (invError) throw invError;

    // 3. Create items
    await supabase.from('invoice_items').insert(
      items.map((i: any) => ({
        invoice_id: invoice.id,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.price
      }))
    );

    // 4. Send Email Delivery
    try {
      // Fetch client details for the email
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', client_id)
        .single();
      
      if (client?.email) {
        let logoBase64 = profile.logo_url;
        if (logoBase64 && logoBase64.startsWith('http')) {
          try {
            const logoRes = await fetch(logoBase64);
            const arrayBuffer = await logoRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const mimeType = logoRes.headers.get('content-type') || 'image/png';
            logoBase64 = `data:${mimeType};base64,${buffer.toString('base64')}`;
          } catch (e) {
            console.error('Failed to fetch logo for PDF', e);
          }
        }

        const pdfBase64 = generateInvoicePDF({
          invoiceNumber: invoice_number,
          date: new Date(),
          dueDate: new Date(invoice.due_date),
          client: {
            name: client.name,
            email: client.email,
            address: client.address
          },
          items: items.map((i: any) => ({
            description: i.description,
            quantity: i.quantity,
            price: i.price
          })),
          taxRate: tax_rate || 0,
          total: total_amount,
          currency: currency || 'USD',
          logoUrl: logoBase64,
          companyName: profile.company_name,
          brandColor: profile.brand_color,
          customFont: profile.custom_font,
          template: profile.invoice_template
        }, true) as string;

        await sendInvoiceEmail(client.email, invoice_number, pdfBase64, {
          brandColor: profile.brand_color,
          logoUrl: profile.logo_url,
          companyName: profile.company_name,
          totalAmount: total_amount,
          currency: currency || 'USD'
        });
      }
    } catch (emailError) {
      console.error('API Invoice Email Error:', emailError);
      // We don't fail the whole request if email fails, but we log it
    }

    return NextResponse.json({ success: true, invoice_id: invoice.id, message: 'Invoice created and email notification triggered' });
  } catch (error: any) {
    console.error('API Invoice Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
