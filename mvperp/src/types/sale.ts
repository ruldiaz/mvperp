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
