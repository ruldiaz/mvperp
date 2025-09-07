// src/types/supplier.ts
export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  street?: string;
  neighborhood?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  municipality?: string;
  rfc?: string;
  totalPurchases: number;
  lastPurchase?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CreateSupplierRequest {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  street?: string;
  neighborhood?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  municipality?: string;
  rfc?: string;
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  id: string;
}

export interface SupplierStats {
  totalSuppliers: number;
  totalPurchases: number;
  topSuppliers: Supplier[];
}

export interface PurchaseItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: {
    name: string;
    sku?: string;
  };
}

export interface Purchase {
  id: string;
  date: string;
  totalAmount: number;
  status: string;
  purchaseItems: PurchaseItem[];
}

export interface SupplierDetails extends Supplier {
  purchases: Purchase[];
}
