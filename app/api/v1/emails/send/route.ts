import { NextRequest, NextResponse } from 'next/server';
import { sendInvoiceEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { to, invoiceNumber, pdfBase64, type, brandColor, logoUrl, companyName, totalAmount, currency } = await req.json();

    if (!to || !invoiceNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Default to invoice if not specified
    const subjectPrefix = type === 'estimate' ? 'Estimate' : 'Invoice';
    
    await sendInvoiceEmail(to, invoiceNumber, pdfBase64, {
      brandColor,
      logoUrl,
      companyName,
      totalAmount,
      currency
    });

    return NextResponse.json({ success: true, message: `Email sent successfully for ${subjectPrefix} ${invoiceNumber}` });
  } catch (error: any) {
    console.error('Email API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
