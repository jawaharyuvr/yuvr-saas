import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { formatCurrency, formatDate } from './format';

type TemplateType =
  | 'minimal_corporate'
  | 'elegant_luxury'
  | 'creative_agency'
  | 'tech_startup'
  | 'dark_mode'
  | 'professional_business'
  | 'colorful_freelancer'
  | 'scandinavian_minimal'
  | 'bold_modern'
  | 'premium_finance';

interface InvoiceData {
  invoiceNumber: string;
  date: string | Date;
  dueDate: string | Date;
  client: { name: string; email: string; address?: string; phone?: string; };
  items: Array<{ description: string; quantity: number; price: number; }>;
  taxRate: number;
  total: number;
  currency: string;
  logoUrl?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  brandColor?: string;
  customFont?: string;
  template?: TemplateType | string;
  notes?: string;
  paymentInstructions?: string;
  discount?: number;
  upiId?: string;
  qrCodeEnabled?: boolean;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const c = hex.replace('#', '');
  if (c.length !== 6) return [99, 102, 241];
  return [parseInt(c.slice(0,2),16), parseInt(c.slice(2,4),16), parseInt(c.slice(4,6),16)];
};

const blend = (rgb: [number,number,number], a: number): [number,number,number] => [
  Math.round(rgb[0]*a + 255*(1-a)),
  Math.round(rgb[1]*a + 255*(1-a)),
  Math.round(rgb[2]*a + 255*(1-a)),
];

export const generateInvoicePDF = async (data: InvoiceData, returnBase64 = false): Promise<string | void> => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const tpl = (data.template as TemplateType) || 'professional_business';
  const isDark = tpl === 'dark_mode';
  const brand = data.brandColor || '#6366f1';
  const rgb = hexToRgb(brand);

  const PW = doc.internal.pageSize.getWidth();   // 210
  const PH = doc.internal.pageSize.getHeight();  // 297
  const ML = 15;
  const MR = 15;
  const CW = PW - ML - MR;

  // Palette
  const TEXT_DARK: [number,number,number]  = isDark ? [240,240,240] : [15,23,42];
  const TEXT_MID:  [number,number,number]  = isDark ? [148,163,184] : [71,85,105];
  const TEXT_MUTE: [number,number,number]  = isDark ? [100,116,139] : [148,163,184];
  const LINE_CLR:  [number,number,number]  = isDark ? [51,65,85]    : [226,232,240];
  const PAGE_BG:   [number,number,number]  = isDark ? [15,23,42]    : [255,255,255];

  // Page background
  doc.setFillColor(...PAGE_BG); doc.rect(0,0,PW,PH,'F');

  let Y = 0; // will be set by header draw

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const setFont = (size: number, style: 'bold'|'normal'|'italic' = 'normal', f = 'helvetica') => {
    doc.setFont(f, style); doc.setFontSize(size);
  };
  const hRule = (y: number, color = LINE_CLR, lw = 0.25) => {
    doc.setDrawColor(...color); doc.setLineWidth(lw); doc.line(ML, y, PW-MR, y);
  };
  const addLogo = (x: number, y: number, maxW = 32, maxH = 20) => {
    if (data.logoUrl) { try { doc.addImage(data.logoUrl, 'PNG', x, y, maxW, maxH); } catch(_){} }
  };

  // ─── TEMPLATE HEADERS ────────────────────────────────────────────────────────

  // 1. PROFESSIONAL BUSINESS — full-width solid brand header
  const drawProfessionalBusiness = () => {
    doc.setFillColor(rgb[0],rgb[1],rgb[2]);
    doc.rect(0,0,PW,36,'F');
    addLogo(ML,8,28,18);
    setFont(22,'bold'); doc.setTextColor(255,255,255);
    doc.text('INVOICE', PW-MR, 18, {align:'right'});
    setFont(8); doc.setTextColor(255,255,255,0.75 as any);
    doc.text(`No. ${data.invoiceNumber}`, PW-MR, 25, {align:'right'});
    doc.text(data.companyName||'', PW-MR, 30, {align:'right'});
    Y = 44;
  };

  // 2. MINIMAL CORPORATE — clean lines, centered logo
  const drawMinimalCorporate = () => {
    if (data.logoUrl) { addLogo(ML,10,28,18); Y=32; } else { Y=16; }
    setFont(20,'bold'); doc.setTextColor(...TEXT_DARK);
    doc.text('INVOICE', PW-MR, 24, {align:'right'});
    setFont(8); doc.setTextColor(...TEXT_MUTE);
    doc.text(`No. ${data.invoiceNumber}`, PW-MR, 30, {align:'right'});
    hRule(36);
    Y = 42;
  };

  // 3. ELEGANT LUXURY — centered title, thin frame border
  const drawElegantLuxury = () => {
    doc.setDrawColor(...TEXT_MUTE); doc.setLineWidth(0.3);
    doc.rect(6,6,PW-12,PH-12);
    if (data.logoUrl) addLogo(PW/2-14,12,28,16); 
    setFont(30,'bold','times'); doc.setTextColor(...blend(rgb,0.7));
    doc.text('INVOICE', PW/2, 44, {align:'center'});
    setFont(9,'italic','times'); doc.setTextColor(...TEXT_MUTE);
    doc.text(`N° ${data.invoiceNumber}`, PW/2, 51, {align:'center'});
    hRule(56);
    Y = 62;
  };

  // 4. CREATIVE AGENCY — thick left sidebar panel
  const drawCreativeAgency = () => {
    const SW = 58; // sidebar width
    doc.setFillColor(rgb[0],rgb[1],rgb[2]);
    doc.rect(0,0,SW,PH,'F');
    if (data.logoUrl) addLogo(8,10,38,24);
    setFont(8,'bold'); doc.setTextColor(255,255,255);
    doc.text(data.companyName||'AGENCY', 8, 42);
    if (data.companyPhone) { setFont(7); doc.text(data.companyPhone, 8, 48); }
    setFont(26,'bold'); doc.setTextColor(255,255,255);
    doc.text('INV', 8, 70);
    setFont(9); doc.text(data.invoiceNumber||'', 8, 77);
    // Bill To in sidebar
    setFont(6,'bold'); doc.setTextColor(255,255,255);
    doc.text('BILL TO', 8, 94);
    setFont(8,'bold'); doc.text((data.client.name||'').toUpperCase(), 8, 100);
    setFont(7,'normal'); doc.setTextColor(220,220,255);
    if (data.client.email) doc.text(data.client.email, 8, 106);
    if (data.client.address) {
      const lines = doc.splitTextToSize(data.client.address, SW-12);
      doc.text(lines, 8, 111);
    }
    Y = 14; // content starts right of sidebar
  };

  // 5. TECH STARTUP — "card" header background
  const drawTechStartup = () => {
    const tint = blend(rgb, 0.07);
    doc.setFillColor(...tint); doc.roundedRect(ML,10,CW,30,3,3,'F');
    addLogo(ML+6,14,22,18);
    setFont(11,'bold'); doc.setTextColor(...TEXT_DARK);
    doc.text(data.companyName||'STARTUP INC', ML+34, 24);
    setFont(8); doc.setTextColor(...TEXT_MID);
    if (data.companyPhone) doc.text(data.companyPhone, ML+34, 30);
    setFont(22,'bold'); doc.setTextColor(rgb[0],rgb[1],rgb[2]);
    doc.text('INVOICE', PW-MR-4, 30, {align:'right'});
    setFont(8); doc.setTextColor(...TEXT_MUTE);
    doc.text(`# ${data.invoiceNumber}`, PW-MR-4, 36, {align:'right'});
    Y = 50;
  };

  // 6. DARK MODE — glowing brand title
  const drawDarkMode = () => {
    doc.setFillColor(15,23,42); doc.rect(0,0,PW,PH,'F');
    // Accent top strip
    doc.setFillColor(rgb[0],rgb[1],rgb[2]); doc.rect(0,0,PW,3,'F');
    if (data.logoUrl) addLogo(ML,10,26,16);
    setFont(26,'bold'); doc.setTextColor(rgb[0],rgb[1],rgb[2]);
    doc.text('INVOICE', PW-MR, 24, {align:'right'});
    setFont(9); doc.setTextColor(...TEXT_MID);
    doc.text(`No. ${data.invoiceNumber}`, PW-MR, 31, {align:'right'});
    setFont(8); doc.setTextColor(rgb[0],rgb[1],rgb[2]);
    doc.text(data.companyName||'', ML, 23);
    if (data.companyPhone) { setFont(7); doc.setTextColor(...TEXT_MID); doc.text(data.companyPhone, ML, 29); }
    hRule(36, [51,65,85]);
    Y = 42;
  };

  // 7. COLORFUL FREELANCER — warm amber diagonal accent
  const drawColorfulFreelancer = () => {
    // Warm amber top arc
    doc.setFillColor(245,158,11);
    doc.roundedRect(0,0,PW,28,0,0,'F');
    setFont(20,'bold'); doc.setTextColor(255,255,255);
    doc.text('INVOICE', ML, 20);
    setFont(9); doc.setTextColor(255,255,255);
    doc.text(`#${data.invoiceNumber}`, ML, 26);
    if (data.logoUrl) addLogo(PW-MR-32,4,28,20);
    Y = 36;
  };

  // 8. SCANDINAVIAN MINIMAL — pure whitespace, fine hairlines
  const drawScandinavianMinimal = () => {
    if (data.logoUrl) addLogo(ML,10,26,16); 
    setFont(9); doc.setTextColor(...TEXT_MUTE);
    doc.text(data.companyName||'', ML, 32);
    setFont(18,'normal'); doc.setTextColor(...TEXT_MUTE);
    doc.text('INVOICE', PW-MR, 22, {align:'right'});
    setFont(8); doc.setTextColor(...TEXT_MUTE);
    doc.text(data.invoiceNumber, PW-MR, 29, {align:'right'});
    hRule(36, TEXT_MUTE, 0.15);
    Y = 42;
  };

  // 9. BOLD MODERN — dark header with left brand accent strip (matches HTML BoldModernHeader)
  const drawBoldModern = () => {
    // Dark header — slate-900 (15,23,42)
    doc.setFillColor(15,23,42);
    doc.rect(0,0,PW,36,'F');
    // Left brand-colored accent strip (matches HTML's w-1.5 left bar)
    doc.setFillColor(rgb[0],rgb[1],rgb[2]);
    doc.rect(0,0,3,36,'F');
    // Logo
    if (data.logoUrl) addLogo(ML, 8, 22, 18);
    // INVOICE label — white, bold
    setFont(22,'bold'); doc.setTextColor(255,255,255);
    doc.text('INVOICE', data.logoUrl ? ML+26 : ML+6, 26);
    // Invoice number — brand color, right-aligned
    setFont(10,'bold'); doc.setTextColor(rgb[0],rgb[1],rgb[2]);
    doc.text(`#${data.invoiceNumber}`, PW-MR, 22, {align:'right'});
    // Company name — gray, right-aligned
    setFont(8,'normal'); doc.setTextColor(148,163,184);
    doc.text(data.companyName||'', PW-MR, 29, {align:'right'});
    Y = 46;
    doc.setTextColor(0,0,0);
  };

  // 10. PREMIUM FINANCE — deep navy header band, structured
  const drawPremiumFinance = () => {
    doc.setFillColor(15,23,42); doc.rect(0,0,PW,32,'F');
    if (data.logoUrl) addLogo(ML,6,24,18);
    setFont(8,'bold'); doc.setTextColor(148,163,184);
    doc.text(data.companyName||'FINANCE CO.', ML+28, 18);
    if (data.companyPhone) { setFont(7); doc.setTextColor(100,116,139); doc.text(data.companyPhone, ML+28, 24); }
    setFont(22,'bold','times'); doc.setTextColor(255,255,255);
    doc.text('INVOICE', PW-MR, 24, {align:'right'});
    doc.setFillColor(rgb[0],rgb[1],rgb[2]); doc.rect(0,32,PW,2,'F');
    Y = 42;
  };

  // ─── DISPATCH ────────────────────────────────────────────────────────────────
  switch(tpl) {
    case 'professional_business': drawProfessionalBusiness(); break;
    case 'minimal_corporate':     drawMinimalCorporate();     break;
    case 'elegant_luxury':        drawElegantLuxury();        break;
    case 'creative_agency':       drawCreativeAgency();       break;
    case 'tech_startup':          drawTechStartup();          break;
    case 'dark_mode':             drawDarkMode();             break;
    case 'colorful_freelancer':   drawColorfulFreelancer();   break;
    case 'scandinavian_minimal':  drawScandinavianMinimal();  break;
    case 'bold_modern':           drawBoldModern();           break;
    case 'premium_finance':       drawPremiumFinance();       break;
    default:                      drawProfessionalBusiness();
  }

  // ─── CONTENT AREA ───────────────────────────────────────────────────────────
  // For creative_agency, content shifts right of sidebar
  const isCA = tpl === 'creative_agency';
  const contentX = isCA ? 65 : ML;
  const contentW = isCA ? (PW - 65 - MR) : CW;
  const col1 = contentX;
  const col2 = contentX + contentW * 0.56;  // QTY right-aligned
  const col3 = contentX + contentW * 0.74;  // UNIT PRICE right-aligned
  const col4 = contentX + contentW;         // TOTAL right-aligned

  // ─── META (dates) + BILL TO ──────────────────────────────────────────────────
  if (!isCA) {
    // Two-column layout: Bill To left | Invoice details right
    const midX = contentX + contentW * 0.55;

    // Bill To
    setFont(7,'bold'); doc.setTextColor(...TEXT_MUTE);
    doc.text('BILL TO', contentX, Y);
    Y += 5;
    setFont(10,'bold'); doc.setTextColor(...TEXT_DARK);
    doc.text(data.client.name||'', contentX, Y);
    Y += 5;
    setFont(8,'normal'); doc.setTextColor(...TEXT_MID);
    if (data.client.address) {
      const lines = doc.splitTextToSize(data.client.address, contentW*0.45);
      doc.text(lines, contentX, Y);
      Y += lines.length * 4.5;
    }
    if (data.client.email) { doc.text(data.client.email, contentX, Y); Y += 4.5; }
    if (data.client.phone) { doc.text(data.client.phone, contentX, Y); }

    // Invoice meta (right column, same row level)
    const metaStartY = Y - (data.client.address ? (doc.splitTextToSize(data.client.address||'',contentW*0.45).length*4.5) : 0) - (data.client.email?4.5:0) - 5 - 5;
    const mY = metaStartY;
    setFont(7,'bold'); doc.setTextColor(...TEXT_MUTE);
    doc.text('INVOICE DATE', midX, mY);
    setFont(8,'normal'); doc.setTextColor(...TEXT_DARK);
    doc.text(formatDate(data.date), midX, mY+5);

    setFont(7,'bold'); doc.setTextColor(...TEXT_MUTE);
    doc.text('DUE DATE', midX, mY+12);
    setFont(8,'bold'); doc.setTextColor(rgb[0],rgb[1],rgb[2]);
    doc.text(formatDate(data.dueDate), midX, mY+17);

    if (data.companyPhone) {
      setFont(7,'bold'); doc.setTextColor(...TEXT_MUTE);
      doc.text('FROM', PW-MR-50, mY);
      setFont(8,'normal'); doc.setTextColor(...TEXT_DARK);
      doc.text(data.companyName||'', PW-MR-50, mY+5);
      doc.text(data.companyPhone, PW-MR-50, mY+10);
    }

    Y += 10;
  } else {
    // For creative agency, just show dates top-right of content area
    setFont(7,'bold'); doc.setTextColor(...TEXT_MUTE);
    doc.text('INVOICE DATE', contentX, Y);
    setFont(8,'normal'); doc.setTextColor(...TEXT_DARK);
    doc.text(formatDate(data.date), contentX, Y+5);
    setFont(7,'bold'); doc.setTextColor(...TEXT_MUTE);
    doc.text('DUE DATE', contentX+50, Y);
    setFont(8,'bold'); doc.setTextColor(rgb[0],rgb[1],rgb[2]);
    doc.text(formatDate(data.dueDate), contentX+50, Y+5);
    Y += 14;
  }

  // ─── TABLE ───────────────────────────────────────────────────────────────────
  Y += 4;
  const TH = 8.5; // table header height

  // Table header bg
  if (isDark) doc.setFillColor(30,41,59);
  else if (tpl==='bold_modern') doc.setFillColor(0,0,0);
  else doc.setFillColor(...blend(rgb,0.12));
  doc.rect(contentX, Y, contentW, TH, 'F');

  setFont(7,'bold');
  if (isDark||tpl==='bold_modern') doc.setTextColor(255,255,255);
  else doc.setTextColor(rgb[0],rgb[1],rgb[2]);

  doc.text('DESCRIPTION', col1+3, Y+5.5);
  doc.text('QTY',   col2,  Y+5.5, {align:'right'});
  doc.text('RATE',  col3,  Y+5.5, {align:'right'});
  doc.text('AMOUNT',col4,  Y+5.5, {align:'right'});

  Y += TH + 2;

  // Rows
  data.items.forEach((item, idx) => {
    const descLines = doc.splitTextToSize(item.description||'—', (col2-col1-6));
    const rowH = Math.max(9, descLines.length*4.8+3);

    // Alternating tint
    if (idx%2===1) {
      doc.setFillColor(...(isDark ? [22,33,51] as [number,number,number] : [248,250,252] as [number,number,number]));
      doc.rect(contentX, Y-1, contentW, rowH, 'F');
    }

    setFont(8.5,'normal'); doc.setTextColor(...TEXT_DARK);
    doc.text(descLines, col1+3, Y+3.5);

    setFont(8.5,'normal'); doc.setTextColor(...TEXT_MID);
    doc.text(String(item.quantity), col2, Y+3.5, {align:'right'});
    doc.text(formatCurrency(item.price, data.currency), col3, Y+3.5, {align:'right'});

    setFont(8.5,'bold'); doc.setTextColor(...TEXT_DARK);
    doc.text(formatCurrency(item.quantity*item.price, data.currency), col4, Y+3.5, {align:'right'});

    Y += rowH;
    doc.setDrawColor(...LINE_CLR); doc.setLineWidth(0.15);
    doc.line(contentX, Y, col4, Y);
  });

  // ─── TOTALS ──────────────────────────────────────────────────────────────────
  Y += 5;
  const subtotal = data.items.reduce((s,i)=>s+(i.quantity*i.price),0);
  const tax = data.taxRate>0 ? subtotal*(data.taxRate/100) : 0;
  const TOTX = col3;
  const TOTW = col4-col3;

  const drawTotRow = (label: string, val: string, bold=false, color=false) => {
    setFont(bold?9.5:8.5, bold?'bold':'normal');
    doc.setTextColor(...TEXT_MID); doc.text(label, TOTX-2, Y, {align:'right'});
    if(color) doc.setTextColor(rgb[0],rgb[1],rgb[2]); else doc.setTextColor(...TEXT_DARK);
    doc.text(val, col4, Y, {align:'right'});
    Y += bold ? 9 : 6;
  };

  drawTotRow('Subtotal', formatCurrency(subtotal, data.currency));
  if (data.discount&&data.discount>0) drawTotRow('Discount', `-${formatCurrency(data.discount, data.currency)}`);
  if (data.taxRate>0) drawTotRow(`Tax (${data.taxRate}%)`, formatCurrency(tax, data.currency));

  // Separator line above total
  doc.setDrawColor(rgb[0],rgb[1],rgb[2]); doc.setLineWidth(0.4);
  doc.line(TOTX-24, Y, col4, Y);
  Y += 3;

  // Total box — draw background first, then text ON TOP
  const totalBoxY = Y - 1;
  const totalBoxH = 10;
  doc.setFillColor(...blend(rgb,0.1));
  doc.roundedRect(TOTX-24, totalBoxY, col4-TOTX+24, totalBoxH, 1,1,'F');

  // Draw TOTAL DUE text on top of the box
  setFont(10,'bold');
  doc.setTextColor(...TEXT_MID); doc.text('TOTAL DUE', TOTX-2, Y+5.5, {align:'right'});
  doc.setTextColor(rgb[0],rgb[1],rgb[2]); doc.text(formatCurrency(data.total, data.currency), col4, Y+5.5, {align:'right'});
  Y += totalBoxH + 3;

  // ─── NOTES ───────────────────────────────────────────────────────────────────
  if (data.notes||data.paymentInstructions) {
    Y += 6;
    hRule(Y);
    Y += 5;
    setFont(7,'bold'); doc.setTextColor(...TEXT_MUTE); doc.text('NOTES & TERMS', contentX, Y); Y+=4;
    setFont(8); doc.setTextColor(...TEXT_MID);
    const nl = doc.splitTextToSize(data.notes||data.paymentInstructions||'', contentW);
    doc.text(nl, contentX, Y); Y += nl.length*4.5;
  }

  // ─── QR CODE ─────────────────────────────────────────────────────────────────
  if (data.upiId&&data.qrCodeEnabled) {
    const uri = `upi://pay?pa=${data.upiId}&pn=${encodeURIComponent(data.companyName||'')}&am=${data.total}&cu=INR&tn=Invoice ${data.invoiceNumber}`;
    try {
      const qrUrl = await QRCode.toDataURL(uri,{margin:1,width:100,color:{dark:isDark?'#fff':'#000',light:isDark?'#0f172a':'#fff'}});
      const qrY = Y+6;
      doc.addImage(qrUrl,'PNG',contentX,qrY,28,28);
      setFont(6.5); doc.setTextColor(...TEXT_MUTE); doc.text('SCAN TO PAY', contentX+14, qrY+30, {align:'center'});
      Y = qrY+34;
    } catch(e){ console.error(e); }
  }

  // ─── FOOTER ──────────────────────────────────────────────────────────────────
  const footerY = PH - 18;
  // Signature line (right side)
  doc.setDrawColor(...TEXT_MUTE); doc.setLineWidth(0.2);
  doc.line(PW-MR-52, footerY-6, PW-MR, footerY-6);
  setFont(7); doc.setTextColor(...TEXT_MUTE);
  doc.text('AUTHORIZED SIGNATURE', PW-MR-52, footerY-2);
  doc.text(data.companyName||'', PW-MR-52, footerY+2);

  // Footer bar
  doc.setFillColor(...blend(rgb, isDark?0.15:0.06));
  doc.rect(0, footerY+6, PW, 12, 'F');
  setFont(7); doc.setTextColor(...TEXT_MUTE);
  doc.text(`${data.companyName||"Yuvr's Invoice"} • Thank you for your business!`, PW/2, footerY+12, {align:'center'});
  setFont(6.5); doc.text(`Invoice ${data.invoiceNumber||''} • Generated via Yuvr's Invoice`, PW/2, footerY+17, {align:'center'});

  if (returnBase64) {
    return (doc.output('datauristring') as string).split(',')[1];
  } else {
    doc.save(`invoice-${data.invoiceNumber||'download'}.pdf`);
  }
};
