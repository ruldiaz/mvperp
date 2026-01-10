// lib/cfdiPdfGenerator.ts
// Generates CFDI-compliant PDF preview using jsPDF

import jsPDF from "jspdf";

interface TableColumnPositions {
  qty: number;
  desc: number;
  unit: number;
  price: number;
  total: number;
}

interface InvoiceData {
  // Invoice info
  id: string;
  serie?: string | null;
  folio?: string | null;
  createdAt: Date | string;
  subtotal?: number | null;
  taxes?: number | null;
  paymentMethod?: string | null;
  paymentForm?: string | null;
  cfdiUse?: string | null;

  // Company (Issuer)
  company: {
    rfc: string;
    name: string;
    regime: string;
    postalCode: string;
    address?: string;
  };

  // Customer (Receiver)
  customer: {
    name: string;
    rfc?: string | null;
    razonSocial?: string | null;
    taxRegime?: string | null;
    fiscalPostalCode?: string | null;
    usoCFDI?: string | null;
  };

  // Items
  items: Array<{
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    saleItem?: {
      description?: string | null;
      product?: {
        name: string;
        sku?: string | null;
        satKey?: string | null;
        satUnitKey?: string | null;
        saleUnit?: string | null;
      } | null;
    } | null;
  }>;
}

export class CfdiPdfGenerator {
  private doc: jsPDF;
  private currentY: number = 0;
  private pageWidth: number = 0;
  private pageHeight: number = 0;
  private margin: number = 20;

  constructor() {
    // Create A4 size PDF
    this.doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.currentY = this.margin;
  }

  async generate(invoiceData: InvoiceData, isPreview: boolean = true): Promise<Blob> {
    // Add watermark if preview
    if (isPreview) {
      this.addWatermark();
    }

    // Header section
    this.addHeader(invoiceData);

    // Issuer and Receiver info
    this.addIssuerReceiverSection(invoiceData);

    // Invoice details
    this.addInvoiceDetails(invoiceData);

    // Items table
    this.addItemsTable(invoiceData);

    // Totals section
    this.addTotalsSection(invoiceData);

    // Footer
    this.addFooter(invoiceData, isPreview);

    // Return as Blob
    return this.doc.output("blob");
  }

  private addWatermark() {
    // Save current graphics state
    this.doc.saveGraphicsState();

    // Set watermark properties
    this.doc.setTextColor(200, 200, 200);
    this.doc.setFontSize(60);
    this.doc.setFont("helvetica", "bold");

    // Calculate center position
    const centerX = this.pageWidth / 2;
    const centerY = this.pageHeight / 2;

    // Rotate and add watermark
    this.doc.text("PREVISUALIZACIÓN", centerX, centerY, {
      angle: 45,
      align: "center",
    });

    this.doc.text("NO VÁLIDO FISCALMENTE", centerX, centerY + 20, {
      angle: 45,
      align: "center",
    });

    // Restore graphics state
    this.doc.restoreGraphicsState();
  }

  private addHeader(invoiceData: InvoiceData) {
    // Title
    this.doc.setFontSize(20);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(0, 51, 102); // Dark blue
    this.doc.text("FACTURA ELECTRÓNICA", this.pageWidth / 2, this.currentY, {
      align: "center",
    });

    this.currentY += 10;

    // Folio
    this.doc.setFontSize(14);
    const folioText = invoiceData.serie && invoiceData.folio
      ? `${invoiceData.serie}-${invoiceData.folio}`
      : `Folio Interno: ${invoiceData.id.slice(0, 8).toUpperCase()}`;
    
    this.doc.text(folioText, this.pageWidth / 2, this.currentY, {
      align: "center",
    });

    this.currentY += 10;

    // Date
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(80, 80, 80);
    const dateStr = this.formatDate(invoiceData.createdAt);
    this.doc.text(`Fecha: ${dateStr}`, this.pageWidth / 2, this.currentY, {
      align: "center",
    });

    this.currentY += 12;
    this.addHorizontalLine();
  }

  private addIssuerReceiverSection(invoiceData: InvoiceData) {
    const leftColumn = this.margin;
    const rightColumn = this.pageWidth / 2 + 5;
    const sectionWidth = this.pageWidth / 2 - this.margin - 5;

    // Draw boxes
    this.doc.setDrawColor(0, 51, 102);
    this.doc.setLineWidth(0.5);
    this.doc.rect(leftColumn, this.currentY, sectionWidth, 40);
    this.doc.rect(rightColumn, this.currentY, sectionWidth, 40);

    // Issuer (Emisor)
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(0, 51, 102);
    this.doc.text("EMISOR", leftColumn + 2, this.currentY + 5);

    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(0, 0, 0);
    const issuerName = this.truncateText(invoiceData.company.name, 40);
    this.doc.text(issuerName, leftColumn + 2, this.currentY + 11);

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(8);
    this.doc.setTextColor(60, 60, 60);
    this.doc.text(`RFC: ${invoiceData.company.rfc}`, leftColumn + 2, this.currentY + 16);
    this.doc.text(`Régimen: ${invoiceData.company.regime}`, leftColumn + 2, this.currentY + 21);
    this.doc.text(`C.P.: ${invoiceData.company.postalCode}`, leftColumn + 2, this.currentY + 26);

    // Receiver (Receptor)
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(0, 51, 102);
    this.doc.text("RECEPTOR", rightColumn + 2, this.currentY + 5);

    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(0, 0, 0);
    const receiverName = this.truncateText(
      invoiceData.customer.razonSocial || invoiceData.customer.name,
      40
    );
    this.doc.text(receiverName, rightColumn + 2, this.currentY + 11);

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(8);
    this.doc.setTextColor(60, 60, 60);
    const rfc = invoiceData.customer.rfc || "XAXX010101000";
    this.doc.text(`RFC: ${rfc}`, rightColumn + 2, this.currentY + 16);
    
    const regime = invoiceData.customer.taxRegime || "616";
    this.doc.text(`Régimen: ${regime}`, rightColumn + 2, this.currentY + 21);
    
    const postalCode = invoiceData.customer.fiscalPostalCode || "00000";
    this.doc.text(`C.P.: ${postalCode}`, rightColumn + 2, this.currentY + 26);
    
    const cfdiUse = invoiceData.cfdiUse || invoiceData.customer.usoCFDI || "G03";
    this.doc.text(`Uso CFDI: ${cfdiUse}`, rightColumn + 2, this.currentY + 31);

    this.currentY += 45;
  }

  private addInvoiceDetails(invoiceData: InvoiceData) {
    // Payment info box
    this.doc.setDrawColor(0, 51, 102);
    this.doc.setFillColor(240, 248, 255);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 15, "FD");

    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(0, 51, 102);
    this.doc.text("INFORMACIÓN DE PAGO", this.margin + 2, this.currentY + 5);

    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(0, 0, 0);

    const paymentMethod = this.getPaymentMethodDescription(
      invoiceData.paymentMethod || "PUE"
    );
    const paymentForm = this.getPaymentFormDescription(
      invoiceData.paymentForm || "01"
    );

    this.doc.text(`Método: ${paymentMethod}`, this.margin + 2, this.currentY + 10);
    this.doc.text(
      `Forma: ${paymentForm}`,
      this.pageWidth / 2,
      this.currentY + 10
    );

    this.currentY += 18;
  }

  private addItemsTable(invoiceData: InvoiceData) {
    // Table header
    this.doc.setFillColor(0, 51, 102);
    this.doc.rect(
      this.margin,
      this.currentY,
      this.pageWidth - 2 * this.margin,
      8,
      "F"
    );

    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(255, 255, 255);

    const colX = {
      qty: this.margin + 2,
      desc: this.margin + 15,
      unit: this.pageWidth - 80,
      price: this.pageWidth - 55,
      total: this.pageWidth - 30,
    };

    this.doc.text("CANT.", colX.qty, this.currentY + 5.5);
    this.doc.text("DESCRIPCIÓN", colX.desc, this.currentY + 5.5);
    this.doc.text("UNIDAD", colX.unit, this.currentY + 5.5);
    this.doc.text("PRECIO", colX.price, this.currentY + 5.5);
    this.doc.text("TOTAL", colX.total, this.currentY + 5.5);

    this.currentY += 8;

    // Table rows
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont("helvetica", "normal");

    invoiceData.items.forEach((item, index) => {
      // Check if we need a new page
      if (this.currentY > this.pageHeight - 50) {
        this.doc.addPage();
        this.currentY = this.margin;
        // Redraw header on new page
        this.addTableHeader(colX);
      }

      // Alternating row colors
      if (index % 2 === 0) {
        this.doc.setFillColor(250, 250, 250);
        this.doc.rect(
          this.margin,
          this.currentY,
          this.pageWidth - 2 * this.margin,
          10,
          "F"
        );
      }

      const description =
        item.saleItem?.description ||
        item.saleItem?.product?.name ||
        "Producto/Servicio";
      
      const unit = item.saleItem?.product?.saleUnit || "Pieza";
      const satKey = item.saleItem?.product?.satKey || "01010101";
      const satUnitKey = item.saleItem?.product?.satUnitKey || "H87";

      // Draw row
      this.doc.setFontSize(8);
      this.doc.text(item.quantity.toString(), colX.qty, this.currentY + 6);
      
      // Description with SAT keys
      const descText = this.truncateText(description, 50);
      this.doc.text(descText, colX.desc, this.currentY + 4);
      this.doc.setFontSize(6);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(
        `Clave SAT: ${satKey} | Unidad: ${satUnitKey}`,
        colX.desc,
        this.currentY + 8
      );
      this.doc.setFontSize(8);
      this.doc.setTextColor(0, 0, 0);

      this.doc.text(unit, colX.unit, this.currentY + 6);
      this.doc.text(
        this.formatCurrency(item.unitPrice),
        colX.price,
        this.currentY + 6
      );
      this.doc.text(
        this.formatCurrency(item.totalPrice),
        colX.total,
        this.currentY + 6
      );

      this.currentY += 10;
    });

    // Bottom border of table
    this.doc.setDrawColor(0, 51, 102);
    this.doc.line(
      this.margin,
      this.currentY,
      this.pageWidth - this.margin,
      this.currentY
    );

    this.currentY += 5;
  }

  private addTableHeader(colX: TableColumnPositions) {
    this.doc.setFillColor(0, 51, 102);
    this.doc.rect(
      this.margin,
      this.currentY,
      this.pageWidth - 2 * this.margin,
      8,
      "F"
    );

    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(255, 255, 255);

    this.doc.text("CANT.", colX.qty, this.currentY + 5.5);
    this.doc.text("DESCRIPCIÓN", colX.desc, this.currentY + 5.5);
    this.doc.text("UNIDAD", colX.unit, this.currentY + 5.5);
    this.doc.text("PRECIO", colX.price, this.currentY + 5.5);
    this.doc.text("TOTAL", colX.total, this.currentY + 5.5);

    this.currentY += 8;
  }

  private addTotalsSection(invoiceData: InvoiceData) {
    const rightX = this.pageWidth - this.margin;
    const labelX = rightX - 60;
    const valueX = rightX - 5;

    // Calculate totals
    const subtotal = invoiceData.subtotal || 0;
    const taxes = invoiceData.taxes || 0;
    const total = subtotal + taxes;

    this.currentY += 5;

    // Subtotal
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "normal");
    this.doc.text("Subtotal:", labelX, this.currentY);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(this.formatCurrency(subtotal), valueX, this.currentY, {
      align: "right",
    });

    this.currentY += 6;

    // IVA
    this.doc.setFont("helvetica", "normal");
    this.doc.text("IVA (16%):", labelX, this.currentY);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(this.formatCurrency(taxes), valueX, this.currentY, {
      align: "right",
    });

    this.currentY += 8;

    // Total box
    this.doc.setFillColor(0, 51, 102);
    this.doc.rect(labelX - 2, this.currentY - 6, 62, 10, "F");

    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(255, 255, 255);
    this.doc.text("TOTAL:", labelX, this.currentY);
    this.doc.text(this.formatCurrency(total), valueX, this.currentY, {
      align: "right",
    });

    this.doc.setTextColor(0, 0, 0);
    this.currentY += 10;
  }

  private addFooter(invoiceData: InvoiceData, isPreview: boolean) {
    this.currentY = this.pageHeight - 40;

    if (isPreview) {
      // Preview notice
      this.doc.setFillColor(255, 250, 205);
      this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 20, "F");

      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(139, 69, 19);
      this.doc.text(
        "⚠️ PREVISUALIZACIÓN - NO VÁLIDO FISCALMENTE",
        this.pageWidth / 2,
        this.currentY + 7,
        { align: "center" }
      );

      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(
        "Este documento es una previsualización y no tiene validez fiscal.",
        this.pageWidth / 2,
        this.currentY + 13,
        { align: "center" }
      );
      this.doc.text(
        "Para que sea válido debe ser timbrado ante el SAT.",
        this.pageWidth / 2,
        this.currentY + 17,
        { align: "center" }
      );
    } else {
      // Actual invoice footer (would include UUID, digital stamp, etc.)
      this.doc.setFontSize(7);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(
        "Este documento es una representación impresa de un CFDI",
        this.pageWidth / 2,
        this.currentY,
        { align: "center" }
      );
    }

    // Page number
    this.doc.setFontSize(8);
    this.doc.setTextColor(150, 150, 150);
    this.doc.text(
      `Página 1 de 1`,
      this.pageWidth / 2,
      this.pageHeight - 10,
      { align: "center" }
    );
  }

  private addHorizontalLine() {
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 3;
  }

  // Helper methods
  private formatDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }

  private getPaymentMethodDescription(method: string): string {
    const methods: Record<string, string> = {
      PUE: "Pago en una sola exhibición",
      PPD: "Pago en parcialidades o diferido",
    };
    return methods[method] || method;
  }

  private getPaymentFormDescription(form: string): string {
    const forms: Record<string, string> = {
      "01": "Efectivo",
      "02": "Cheque nominativo",
      "03": "Transferencia electrónica",
      "04": "Tarjeta de crédito",
      "28": "Tarjeta de débito",
      "99": "Por definir",
    };
    return forms[form] || form;
  }
}

export const cfdiPdfGenerator = new CfdiPdfGenerator();
