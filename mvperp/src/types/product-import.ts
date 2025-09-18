// src/types/product-import.ts
export interface CSVProduct {
  name: string;
  type?: string;
  barcode?: string;
  category?: string;
  sku?: string;
  sellAtPOS?: string;
  includeInCatalog?: string;
  requirePrescription?: string;
  saleUnit?: string;
  brand?: string;
  description?: string;
  useStock?: string;
  quantity?: string;
  price?: string;
  cost?: string;
  stock?: string;
  image?: string;
  location?: string;
  minimumQuantity?: string;
  satKey?: string;
  iva?: string;
  ieps?: string;
  satUnitKey?: string;
  ivaIncluded?: string;
}

export interface ImportResult {
  success: number;
  errors: number;
  details: ImportDetail[];
}

export interface ImportDetail {
  row: number;
  productName: string;
  status: "success" | "error";
  message: string;
}

export interface CSVImportConfig {
  delimiter: string;
  hasHeaders: boolean;
  mapping: FieldMapping;
}

export interface FieldMapping {
  name: string;
  type: string;
  barcode: string;
  category: string;
  sku: string;
  sellAtPOS: string;
  includeInCatalog: string;
  requirePrescription: string;
  saleUnit: string;
  brand: string;
  description: string;
  useStock: string;
  quantity: string;
  price: string;
  cost: string;
  stock: string;
  image: string;
  location: string;
  minimumQuantity: string;
  satKey: string;
  iva: string;
  ieps: string;
  satUnitKey: string;
  ivaIncluded: string;
}
