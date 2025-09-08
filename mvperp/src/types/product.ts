// src/types/product.ts

export interface Variant {
  id?: string; // opcional porque al crear aún no tiene id
  type: string; // tamaño, color, material, estilo
  value: string; // ejemplo: "rojo", "XL"
}

export interface PriceList {
  id?: string;
  name: string; // ejemplo: "Retail", "Mayoreo"
  price: number;
}

export interface Product {
  id?: string;
  userId?: string; // opcional al crear
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

  variants?: Variant[];
  priceLists?: PriceList[];
}
