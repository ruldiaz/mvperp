// types/purchase.ts
export interface PurchaseItemRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseRequest {
  supplierId: string;
  items: PurchaseItemRequest[];
  notes?: string;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: Date;
  product?: {
    id: string;
    name: string;
    sku?: string;
  };
}

export interface Purchase {
  id: string;
  supplierId: string;
  userId: string;
  date: Date;
  totalAmount: number;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    name: string;
  };
  supplier: {
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
  };
  purchaseItems: PurchaseItem[];
  debt?: number;
}

// PurchaseDetail es exactamente igual a Purchase
export type PurchaseDetail = Purchase;
