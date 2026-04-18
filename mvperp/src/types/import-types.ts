export interface ImportedItemData {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  typedPrice: number;
  totalPrice: number;
  cost: number;
  margin: number;
  satProductKey: string;
  satUnitKey: string;
  taxMode: "net" | "gross";
}
