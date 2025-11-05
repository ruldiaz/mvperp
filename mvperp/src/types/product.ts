// src/types/product.ts
export interface Variant {
  id?: string;
  type: string;
  value: string;
}

export interface PriceList {
  id?: string;
  name: string;
  price: number;
}

// Agrega esta interfaz para QuotationItem
export interface QuotationItem {
  id?: string;
  quotationId?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  satProductKey?: string;
  satUnitKey?: string;
  description?: string;

  // Relaciones
  product?: Product;
  quotation?: {
    id?: string;
    customerId?: string;
    date?: Date | string;
  };
}

export interface Product {
  id?: string;
  userId?: string;
  name: string;
  type: "producto" | "servicio";
  barcode?: string;
  category?: string;
  sku?: string;
  sellAtPOS: boolean;
  includeInCatalog: boolean;
  requirePrescription: boolean;
  saleUnit?: string;
  brand?: string;
  description?: string;
  useStock: boolean;
  quantity?: number;
  price?: number;
  cost?: number;
  stock?: number;
  image?: string;
  location?: string;
  minimumQuantity?: number;
  satKey?: string;
  iva?: number;
  ieps?: number;
  satUnitKey?: string;
  ivaIncluded: boolean; // Nuevo campo
  createdAt?: Date;
  updatedAt?: Date;

  variants?: Variant[];
  priceLists?: PriceList[];
  quotationItems?: QuotationItem[];
}
