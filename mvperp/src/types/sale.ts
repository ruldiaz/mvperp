// src/types/sale.ts
import { Customer } from "./customer";

export interface SaleItem {
  id?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  satProductKey?: string;
  satUnitKey?: string;
  description?: string;
  product?: {
    name: string;
    sku?: string;
    satKey?: string;
    satUnitKey?: string;
  };
}

export interface Sale {
  id?: string;
  customerId: string;
  userId?: string;
  date: Date | string;
  totalAmount: number;
  status: string;
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;

  customer?: Customer;
  user?: {
    name: string;
  };
  saleItems: SaleItem[];
}

export interface CreateSaleRequest {
  customerId: string;
  saleItems: Omit<SaleItem, "id" | "totalPrice">[];
  notes?: string;
}

export interface UpdateSaleRequest {
  id: string;
  customerId?: string;
  saleItems?: Omit<SaleItem, "id" | "totalPrice">[];
  notes?: string;
  status?: string;
}

// Agrega al final del archivo types/sale.ts

// Tipos para Cotizaciones
export interface QuotationItem {
  id?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  satProductKey?: string;
  satUnitKey?: string;
  description?: string;
  product?: {
    name: string;
    sku?: string;
    satKey?: string;
    satUnitKey?: string;
  };
}

export interface Quotation {
  id?: string;
  customerId: string;
  userId?: string;
  date: Date | string;
  expiryDate?: Date | string;
  totalAmount: number;
  status: "pending" | "accepted" | "rejected" | "expired" | "converted";
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;

  customer?: Customer;
  user?: {
    name: string;
  };
  quotationItems: QuotationItem[];
}

export interface CreateQuotationRequest {
  customerId: string;
  expiryDate?: string;
  quotationItems: Omit<QuotationItem, "id" | "totalPrice">[];
  notes?: string;
}

export interface UpdateQuotationRequest {
  id: string;
  customerId?: string;
  expiryDate?: string;
  status?: string;
  notes?: string;
}
