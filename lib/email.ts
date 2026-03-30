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
    dueDate?: string;
    clientName?: string;
  }
) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured. Get one at https://resend.com/api-keys');
  }
  if (!to || !to.includes('@')) {
    throw new Error('A valid recipient email address is required.');
  }

  const brandColor  = options?.brandColor  || '#6366f1';
  const companyName = options?.companyName || "Yuvr's";
  const currency    = options?.currency    || 'USD';
  const clientName  = options?.clientName  || 'Valued Client';
  const formattedAmount = options?.totalAmount !== undefined
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(options.totalAmount)
    : null;

  // Subtle brand-color tint for backgrounds (10% opacity simulated)
  const hexToRgb = (hex: string) => {
    const c = hex.replace('#', '');
    return {
      r: parseInt(c.slice(0, 2), 16),
      g: parseInt(c.slice(2, 4), 16),
      b: parseInt(c.slice(4, 6), 16),
    };
  };
  const { r, g, b } = hexToRgb(brandColor);
  const tintBg = `rgba(${r},${g},${b},0.08)`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${invoiceNumber} from ${companyName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:40px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

          <!-- ── HEADER ── -->
          <tr>
            <td style="background:linear-gradient(135deg,${brandColor} 0%,${brandColor}dd 100%);padding:36px 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    ${options?.logoUrl
                      ? `<img src="${options.logoUrl}" alt="${companyName}" style="height:44px;max-width:160px;object-fit:contain;display:block;margin-bottom:12px;" />`
                      : `<div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;margin-bottom:12px;">${companyName}</div>`
                    }
                    <div style="font-size:13px;color:rgba(255,255,255,0.75);font-weight:500;letter-spacing:0.5px;text-transform:uppercase;">
                      Invoice Notification
                    </div>
                  </td>
                  <td align="right" style="vertical-align:top;">
                    <div style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:10px;padding:12px 18px;display:inline-block;text-align:right;">
                      <div style="font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Invoice No.</div>
                      <div style="font-size:18px;font-weight:800;color:#ffffff;">${invoiceNumber}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── GREETING ── -->
          <tr>
            <td style="padding:36px 40px 0;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">
                Hello, ${clientName}!
              </p>
              <p style="margin:0;font-size:15px;color:#6b7280;line-height:1.6;">
                You have a new invoice from <strong style="color:#111827;">${companyName}</strong>.
                Please find the details below and the PDF attached to this email.
              </p>
            </td>
          </tr>

          <!-- ── INVOICE SUMMARY BOX ── -->
          <tr>
            <td style="padding:28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:${tintBg};border:1px solid rgba(${r},${g},${b},0.15);border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:24px 28px;">
                    <table width="100%" cellpadding="0" cellspacing="0">

                      <!-- Invoice # row -->
                      <tr>
                        <td style="padding-bottom:14px;border-bottom:1px solid rgba(${r},${g},${b},0.12);">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Invoice Number</td>
                              <td align="right" style="font-size:13px;font-weight:700;color:#111827;">${invoiceNumber}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      ${options?.dueDate ? `
                      <!-- Due date row -->
                      <tr>
                        <td style="padding:14px 0;border-bottom:1px solid rgba(${r},${g},${b},0.12);">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Due Date</td>
                              <td align="right" style="font-size:13px;font-weight:700;color:${brandColor};">${options.dueDate}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>` : ''}

                      ${formattedAmount ? `
                      <!-- Amount due row -->
                      <tr>
                        <td style="padding-top:18px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Amount Due</td>
                              <td align="right">
                                <span style="display:inline-block;background:${brandColor};color:#ffffff;font-size:20px;font-weight:800;padding:8px 20px;border-radius:8px;letter-spacing:-0.5px;">
                                  ${formattedAmount}
                                </span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>` : ''}

                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── PDF NOTICE ── -->
          <tr>
            <td style="padding:0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:14px;">
                          <!-- Paperclip icon (inline SVG) -->
                          <div style="width:36px;height:36px;background:rgba(${r},${g},${b},0.10);border-radius:8px;display:flex;align-items:center;justify-content:center;">
                            <span style="font-size:18px;">📎</span>
                          </div>
                        </td>
                        <td>
                          <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:3px;">PDF Invoice Attached</div>
                          <div style="font-size:12px;color:#9ca3af;">The full invoice PDF is attached to this email for your records.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── DIVIDER ── -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:#e5e7eb;"></div>
            </td>
          </tr>

          <!-- ── THANK YOU ── -->
          <tr>
            <td style="padding:32px 40px 36px;">
              <p style="margin:0 0 6px;font-size:15px;color:#111827;font-weight:600;">
                Thank you for your business! 🙏
              </p>
              <p style="margin:0;font-size:14px;color:#9ca3af;line-height:1.6;">
                If you have any questions about this invoice, please don't hesitate to reach out.
                We appreciate your continued trust in ${companyName}.
              </p>
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;border-radius:0 0 16px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12px;color:#9ca3af;">
                    Sent by <strong style="color:#6b7280;">${companyName}</strong> via Yuvr's
                  </td>
                  <td align="right" style="font-size:12px;color:#9ca3af;">
                    Invoice&nbsp;${invoiceNumber}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- End card -->

        <!-- Bottom note -->
        <p style="margin:20px 0 0;font-size:11px;color:#9ca3af;text-align:center;">
          This is an automated message. Please do not reply directly to this email.
        </p>

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: `${companyName} <onboarding@resend.dev>`,
      to: [to],
      subject: `Invoice ${invoiceNumber} from ${companyName}${formattedAmount ? ` — ${formattedAmount} Due` : ''}`,
      html,
      ...(pdfBase64 ? {
        attachments: [
          {
            filename: `invoice-${invoiceNumber}.pdf`,
            content: pdfBase64,
          }
        ]
      } : {}),
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
};
