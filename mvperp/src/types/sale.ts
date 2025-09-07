// src/types/sale.ts
import { Customer } from "./customer"; // Importar el tipo Customer

export interface SaleItem {
  id?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: {
    name: string;
    sku?: string;
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
