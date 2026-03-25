import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendInvoiceEmail = async (
  to: string, 
  invoiceNumber: string, 
  pdfBase64?: string,
  options?: {
    brandColor?: string;
    logoUrl?: string;
    companyName?: string;
    totalAmount?: number;
    currency?: string;
  }
) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set in environment variables. Get one at https://resend.com/api-keys');
  }
  if (!to || !to.includes('@')) {
    throw new Error('A valid recipient email address is required.');
  }

  const brandColor = options?.brandColor || '#6366f1';
  const companyName = options?.companyName || 'Yuvr-SaaS';

  try {
    const { data, error } = await resend.emails.send({
      from: 'Yuvr-SaaS <onboarding@resend.dev>',
      to: [to],
      subject: `New Invoice ${invoiceNumber} from ${companyName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          ${options?.logoUrl ? `<img src="${options.logoUrl}" alt="${companyName} Logo" style="max-height: 60px; margin-bottom: 20px;" />` : ''}
          <h1 style="color: ${brandColor};">${companyName} sent you an invoice</h1>
          <p>Hello,</p>
          <p>You have received a new invoice <strong>${invoiceNumber}</strong>.</p>
          ${options?.totalAmount ? `<p style="font-size: 18px; margin: 20px 0;">Amount Due: <strong style="color: ${brandColor};">${options.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${options.currency || 'USD'}</strong></p>` : ''}
          <p>Please find the PDF copy attached to this email.</p>
          <p style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; color: #666; font-size: 14px;">
            Thank you for your business!
          </p>
        </div>
      `,
      ...(pdfBase64 ? {
        attachments: [
          {
            filename: `${invoiceNumber}.pdf`,
            content: pdfBase64,
          }
        ]
      } : {}),
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
