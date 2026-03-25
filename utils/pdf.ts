import jsPDF from 'jspdf';
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
  client: {
    name: string;
    email: string;
    address?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    price: number;
  }>;
  taxRate: number;
  total: number;
  currency: string;
  logoUrl?: string;
  companyName?: string;
  brandColor?: string;
  customFont?: string;
  template?: TemplateType | string;
  notes?: string;
  paymentInstructions?: string;
  discount?: number;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

export const generateInvoicePDF = (data: InvoiceData, returnBase64 = false): string | void => {
  const doc = new jsPDF();
  const template = (data.template as TemplateType) || 'professional_business';
  const brandColor = data.brandColor || '#6366f1';
  const rgbBrand = hexToRgb(brandColor);
  const font = data.customFont === 'Inter' ? 'helvetica' : 'helvetica';
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Dark Mode Support
  const isDark = template === 'dark_mode';
  if (isDark) {
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setTextColor(255, 255, 255);
  } else {
    doc.setTextColor(30, 41, 59);
  }

  const drawBackground = () => {
    if (template === 'tech_startup') {
      doc.setFillColor(rgbBrand[0], rgbBrand[1], rgbBrand[2]);
      doc.rect(0, 0, pageWidth, 5, 'F');
    } else if (template === 'creative_agency') {
       // Light 20% opacity circle in top right
       const mixR = Math.round(rgbBrand[0] * 0.20 + 255 * 0.80);
       const mixG = Math.round(rgbBrand[1] * 0.20 + 255 * 0.80);
       const mixB = Math.round(rgbBrand[2] * 0.20 + 255 * 0.80);
       doc.setFillColor(mixR, mixG, mixB);
       doc.circle(pageWidth, 0, 45, 'F');
    } else if (template === 'premium_finance') {
       doc.setDrawColor(rgbBrand[0], rgbBrand[1], rgbBrand[2]);
       doc.setLineWidth(0.7);
       doc.line(margin, 10, pageWidth - margin, 10);
       doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
    } else if (template === 'bold_modern') {
       doc.setFillColor(rgbBrand[0], rgbBrand[1], rgbBrand[2]);
       doc.rect(pageWidth - 60, 0, 60, 80, 'F');
    }
  };

  const drawHeader = () => {
    let cursorY = 25;
    doc.setFont(font, "bold");

    // Helper to draw standard logo for most templates
    const drawStandardLogo = () => {
      if (data.logoUrl) {
        try {
          doc.addImage(data.logoUrl, 'PNG', margin, cursorY, 30, 30);
          return 35; // height offset
        } catch (e) {}
      }
      return 0;
    };

    if (template === 'minimal_corporate') {
      const logoOffset = drawStandardLogo();
      cursorY += logoOffset ? logoOffset + 10 : 0;
      doc.setFontSize(28);
      doc.text("INVOICE", margin, cursorY);
      doc.setFontSize(10);
      doc.setTextColor(isDark ? 200 : 150, isDark ? 200 : 150, isDark ? 200 : 150);
      doc.text(`#${data.invoiceNumber || ''}`, pageWidth - margin, cursorY, { align: 'right' });
      return Math.max(cursorY + 15, 45);
    }

    if (template === 'elegant_luxury') {
      if (data.logoUrl) {
        try {
          doc.addImage(data.logoUrl, 'PNG', (pageWidth/2) - 15, cursorY, 30, 30);
          cursorY += 40;
        } catch (e) {}
      }
      doc.setFontSize(32);
      doc.setTextColor(rgbBrand[0], rgbBrand[1], rgbBrand[2]);
      doc.text("INVOICE", pageWidth / 2, cursorY, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(isDark ? 255 : 51, isDark ? 255 : 51, isDark ? 255 : 51);
      doc.text(`NUMBER: ${data.invoiceNumber || ''}`, pageWidth / 2, cursorY + 8, { align: 'center' });
      return Math.max(cursorY + 20, 70);
    }

    if (template === 'creative_agency') {
      const logoOffset = drawStandardLogo();
      doc.setTextColor(rgbBrand[0], rgbBrand[1], rgbBrand[2]);
      doc.setFontSize(36);
      doc.text("INVOICE", pageWidth - margin, 35, { align: "right" });
      doc.setFontSize(10);
      doc.setTextColor(isDark ? 200 : 100, isDark ? 200 : 100, isDark ? 200 : 100);
      doc.text(`#${data.invoiceNumber || ''}`, pageWidth - margin, 42, { align: "right" });
      return Math.max(cursorY + logoOffset, 60);
    }

    if (template === 'tech_startup') {
      const logoOffset = drawStandardLogo();
      cursorY += logoOffset ? logoOffset + 5 : 0;
      doc.setFontSize(24);
      doc.text("INVOICE", margin, cursorY);
      doc.setFontSize(10);
      doc.setTextColor(rgbBrand[0], rgbBrand[1], rgbBrand[2]);
      doc.text(data.invoiceNumber || '', margin, cursorY + 7);
      return Math.max(cursorY + 20, 70);
    }

    if (template === 'scandinavian_minimal') {
       const logoOffset = drawStandardLogo();
       cursorY += logoOffset ? logoOffset + 10 : 0;
       doc.setFontSize(20);
       doc.setFont(font, 'normal');
       doc.text("INVOICE", margin, cursorY);
       doc.setFontSize(10);
       doc.text(`#${data.invoiceNumber || ''}`, pageWidth - margin, cursorY, { align: "right" });
       return Math.max(cursorY + 15, 60);
    }

    if (template === 'bold_modern') {
       const logoOffset = drawStandardLogo();
       doc.setFontSize(36);
       doc.setTextColor(isDark ? 30 : 255, isDark ? 30 : 255, isDark ? 30 : 255);
       doc.text("INVOICE", pageWidth - 30, 45, { align: 'center' });
       doc.setFontSize(10);
       doc.setTextColor(isDark ? 200 : 255, isDark ? 200 : 255, isDark ? 200 : 255);
       doc.text(data.invoiceNumber || '', pageWidth - 30, 55, { align: 'center' });
       return Math.max(cursorY + logoOffset, 90);
    }

    // Default Header (Professional)
    const logoOffset = drawStandardLogo();
    cursorY += logoOffset;
    doc.setTextColor(rgbBrand[0], rgbBrand[1], rgbBrand[2]);
    doc.setFontSize(22);
    doc.text("INVOICE", pageWidth - margin, 35, { align: "right" });
    doc.setFontSize(10);
    doc.setTextColor(isDark ? 200 : 100, isDark ? 200 : 100, isDark ? 200 : 100);
    doc.text(data.invoiceNumber || '', pageWidth - margin, 42, { align: "right" });
    return Math.max(cursorY, 60);
  };

  drawBackground();
  let cursorY = drawHeader();

  // BILLING SECTION
  const billingX = margin;
  doc.setFontSize(10);
  doc.setTextColor(isDark ? 200 : 100, isDark ? 200 : 100, isDark ? 200 : 100);
  doc.setFont(font, "bold");
  doc.text("BILL TO", billingX, cursorY);

  doc.setTextColor(isDark ? 255 : 30, isDark ? 255 : 30, isDark ? 255 : 30);
  doc.setFontSize(12);
  doc.text(data.client.name, billingX, cursorY + 7);
  
  doc.setFontSize(9);
  doc.setFont(font, "normal");
  let billingGutter = 13;
  if (data.client.address) {
    const splitAddress = doc.splitTextToSize(data.client.address, 70);
    doc.text(splitAddress, billingX, cursorY + billingGutter);
    billingGutter += (splitAddress.length * 4) + 2;
  }
  doc.text(data.client.email, billingX, cursorY + billingGutter);

  // DATES
  const dateX = pageWidth - margin - 50;
  doc.setFont(font, "bold");
  doc.setFontSize(9);
  doc.setTextColor(isDark ? 200 : 100, isDark ? 200 : 100, isDark ? 200 : 100);
  doc.text("Issue date:", dateX, cursorY + 7);
  doc.setTextColor(isDark ? 255 : 30, isDark ? 255 : 30, isDark ? 255 : 30);
  doc.text(formatDate(data.date), pageWidth - margin, cursorY + 7, { align: "right" });
  
  doc.setTextColor(isDark ? 200 : 100, isDark ? 200 : 100, isDark ? 200 : 100);
  doc.text("Due date:", dateX, cursorY + 13);
  doc.setTextColor(rgbBrand[0], rgbBrand[1], rgbBrand[2]);
  doc.text(formatDate(data.dueDate), pageWidth - margin, cursorY + 13, { align: "right" });

  cursorY += Math.max(billingGutter + 20, 40);

  // ITEMS TABLE
  const tableMargin = margin;
  const tableWidth = pageWidth - 2 * margin;

  if (template !== 'scandinavian_minimal' && template !== 'dark_mode') {
    // Light background header
    // Simulate ~15% opacity by interpolating towards white: 0.15 * brand + 0.85 * 255
    const mixR = Math.round(rgbBrand[0] * 0.15 + 255 * 0.85);
    const mixG = Math.round(rgbBrand[1] * 0.15 + 255 * 0.85);
    const mixB = Math.round(rgbBrand[2] * 0.15 + 255 * 0.85);
    doc.setFillColor(mixR, mixG, mixB);
    doc.setDrawColor(mixR, mixG, mixB);
    doc.roundedRect(tableMargin, cursorY, tableWidth, 10, 2, 2, 'F');
    // Colored text
    doc.setTextColor(rgbBrand[0], rgbBrand[1], rgbBrand[2]);
  } else if (template === 'dark_mode') {
    doc.setFillColor(51, 65, 85);
    doc.roundedRect(tableMargin, cursorY, tableWidth, 10, 2, 2, 'F');
    doc.setTextColor(200, 200, 200);
  } else {
    // scandinavian_minimal
    doc.setTextColor(150, 150, 150);
    doc.setDrawColor(220, 220, 220);
    doc.line(tableMargin, cursorY + 10, pageWidth - margin, cursorY + 10);
  }

  doc.setFont(font, "bold");
  doc.setFontSize(9);
  doc.text("DESCRIPTION", tableMargin + 4, cursorY + 6.5);
  doc.text("QTY", tableMargin + tableWidth - 60, cursorY + 6.5, { align: "right" });
  doc.text("PRICE", tableMargin + tableWidth - 30, cursorY + 6.5, { align: "right" });
  doc.text("TOTAL", tableMargin + tableWidth - 4, cursorY + 6.5, { align: "right" });

  cursorY += 15;
  doc.setTextColor(isDark ? 230 : 51, isDark ? 230 : 51, isDark ? 230 : 51);
  doc.setFont(font, "normal");

  data.items.forEach((item) => {
    const splitDesc = doc.splitTextToSize(item.description, 80);
    doc.text(splitDesc, tableMargin + 4, cursorY);
    doc.text(item.quantity.toString(), tableMargin + tableWidth - 60, cursorY, { align: "right" });
    doc.text(item.price.toFixed(2), tableMargin + tableWidth - 30, cursorY, { align: "right" });
    doc.text((item.quantity * item.price).toFixed(2), tableMargin + tableWidth - 4, cursorY, { align: "right" });
    cursorY += (splitDesc.length * 5) + 3;
    doc.setDrawColor(isDark ? 60 : 240, isDark ? 60 : 240, isDark ? 60 : 240);
    doc.line(tableMargin, cursorY - 2, tableMargin + tableWidth - 4, cursorY - 2);
    cursorY += 5;
  });

  // TOTALS SECTION
  cursorY += 5;
  const computedItemsSubtotal = data.items && data.items.length 
    ? data.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0)
    : 0;
  
  const subtotal = computedItemsSubtotal > 0 
    ? computedItemsSubtotal 
    : (data.total / (1 + (data.taxRate || 0) / 100));
  
  const taxAmount = data.total - subtotal;
  
  const drawTotalLine = (label: string, value: string, isGrandTotal = false) => {
    doc.setFontSize(isGrandTotal ? 14 : 10);
    doc.setFont(font, isGrandTotal ? "bold" : "normal");
    
    // Label
    doc.setTextColor(isDark ? 200 : 100, isDark ? 200 : 100, isDark ? 200 : 100);
    if (isGrandTotal) doc.setTextColor(isDark ? 255 : 30, isDark ? 255 : 30, isDark ? 255 : 30);
    doc.text(label, tableMargin + tableWidth - 50, cursorY, { align: "right" });
    
    // Value
    if (isGrandTotal) {
      doc.setTextColor(template === 'dark_mode' ? 255 : rgbBrand[0], template === 'dark_mode' ? 255 : rgbBrand[1], template === 'dark_mode' ? 255 : rgbBrand[2]);
    } else {
      doc.setTextColor(isDark ? 255 : 30, isDark ? 255 : 30, isDark ? 255 : 30);
    }
    doc.text(value, tableMargin + tableWidth - 4, cursorY, { align: "right" });
    
    cursorY += isGrandTotal ? 12 : 7;
  };

  drawTotalLine("SUBTOTAL", formatCurrency(subtotal, data.currency));
  if (data.taxRate > 0) {
    drawTotalLine(`TAX (${data.taxRate}%):`, formatCurrency(taxAmount, data.currency));
  }
  
  doc.setDrawColor(rgbBrand[0], rgbBrand[1], rgbBrand[2]);
  doc.setLineWidth(0.5);
  doc.line(tableMargin + tableWidth - 60, cursorY - 5, tableMargin + tableWidth - 4, cursorY - 5);
  cursorY += 5;
  drawTotalLine("TOTAL DUE", formatCurrency(data.total, data.currency), true);

  // NOTES & SIGNATURE
  cursorY += 10;
  if (data.notes || data.paymentInstructions) {
    doc.setFontSize(8);
    doc.setTextColor(isDark ? 200 : 100, isDark ? 200 : 100, isDark ? 200 : 100);
    doc.setFont(font, 'bold');
    doc.text("TERMS & NOTES", margin, cursorY);
    doc.setFont(font, 'normal');
    const notesText = doc.splitTextToSize(data.notes || data.paymentInstructions || '', 100);
    doc.text(notesText, margin, cursorY + 5);
  }

  // Signature line
  const sigY = pageHeight - 40;
  doc.setDrawColor(isDark ? 200 : 100, isDark ? 200 : 100, isDark ? 200 : 100);
  doc.line(pageWidth - margin - 50, sigY, pageWidth - margin, sigY);
  doc.setFontSize(7);
  doc.text("AUTHORIZED SIGNATURE", pageWidth - margin - 50, sigY + 5);

  // FOOTER
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated by Yuvr-SaaS • ${data.companyName || 'Corporate Invoicing'}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  if (returnBase64) {
    const dataUri = doc.output('datauristring') as string;
    return dataUri.split(',')[1];
  } else {
    doc.save(`${data.invoiceNumber}.pdf`);
  }
};

