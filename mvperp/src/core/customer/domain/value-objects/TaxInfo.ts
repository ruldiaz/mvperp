// src/core/customer/domain/value-objects/TaxInfo.ts
import { CustomerError } from "../exceptions/CustomerError";

export class TaxInfo {
  private constructor(
    private readonly usoCFDI: string,
    private readonly taxRegime: string
  ) {}

  static create(usoCFDI?: string, taxRegime?: string): TaxInfo | null {
    if (!usoCFDI || !taxRegime) return null;

    if (!this.isValidUsoCFDI(usoCFDI)) {
      throw new CustomerError(`Uso CFDI inválido: ${usoCFDI}`);
    }

    if (!this.isValidTaxRegime(taxRegime)) {
      throw new CustomerError(`Régimen fiscal inválido: ${taxRegime}`);
    }

    return new TaxInfo(usoCFDI, taxRegime);
  }

  private static isValidUsoCFDI(usoCFDI: string): boolean {
    const validUses = [
      "G01",
      "G02",
      "G03",
      "I01",
      "I02",
      "I03",
      "I04",
      "I05",
      "I06",
      "I07",
      "I08",
      "D01",
      "D02",
      "D03",
      "D04",
      "D05",
      "D06",
      "D07",
      "D08",
      "D09",
      "D10",
      "S01",
    ];
    return validUses.includes(usoCFDI);
  }

  private static isValidTaxRegime(regime: string): boolean {
    const validRegimes = [
      "601",
      "603",
      "605",
      "606",
      "607",
      "608",
      "609",
      "610",
      "611",
      "612",
      "614",
      "615",
      "616",
      "620",
      "621",
      "622",
      "623",
      "624",
      "625",
      "626",
    ];
    return validRegimes.includes(regime);
  }

  getUsoCFDI(): string {
   return this.usoCFDI;
  }

  getTaxRegime(): string {
   return this.taxRegime;
  }
}
