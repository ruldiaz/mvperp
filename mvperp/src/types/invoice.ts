// types/invoice.ts
export interface InvoiceItem {
  id?: string;
  invoiceId?: string;
  saleItemId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  saleItem?: {
    product?: {
      name: string;
      sku?: string;
    };
    description?: string;
  };
}

export interface Invoice {
  id?: string;
  saleId?: string;
  customerId: string;
  companyId?: string;
  uuid?: string;
  serie?: string;
  folio?: string;
  status: "pending" | "stamped" | "cancelled";
  xmlUrl?: string;
  pdfUrl?: string;
  cancelledAt?: Date | string;
  paymentMethod?: string;
  paymentForm?: string;
  currency?: string;
  exchangeRate?: number;
  subtotal?: number;
  discount?: number;
  taxes?: number;
  cfdiUse?: string;
  relatedInvoices?: string;
  cancellationStatus?: string;
  cancellationReceipt?: string;
  paymentAccount?: string;
  verificationUrl?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;

  // Relaciones
  customer?: {
    name: string;
    rfc?: string;
    email?: string;
  };
  sale?: {
    id: string;
    date: Date | string;
  };
  company?: {
    name: string;
    rfc: string;
  };
  invoiceItems?: InvoiceItem[];
}

// types/invoice.ts
export interface CreateInvoiceRequest {
  saleId?: string; // Opcional para facturas directas
  customerId: string;
  invoiceItems: Array<{
    productId?: string; // Para facturas de ventas existentes
    description: string; // Para facturas directas
    quantity: number;
    unitPrice: number;
    satProductKey?: string;
    satUnitKey?: string;
  }>;
  paymentMethod?: string;
  paymentForm?: string;
  cfdiUse?: string;
  currency?: string;
  exchangeRate?: number;
  notes?: string;
}

export interface UpdateInvoiceRequest {
  id: string;
  status?: string;
  cancellationStatus?: string;
  cancellationReceipt?: string;
}
