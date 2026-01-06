// src/core/shared/domain/value-objects/RFC.ts

export class InvalidRFCError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidRFCError";
  }
}

export type RFCType = "MORAL" | "FISICA" | "GENERICO" | "EXTRANJERO";

export class RFC {
  private constructor(
    public readonly value: string,
    public readonly type: RFCType
  ) {}

  // ========== FACTORY METHODS ==========

  static create(value: string): RFC {
    const trimmed = value.trim().toUpperCase();

    if (!this.isValidFormat(trimmed)) {
      throw new InvalidRFCError(`Formato de RFC inválido: ${value}`);
    }

    const type = this.determineType(trimmed);
    return new RFC(trimmed, type);
  }

  static createNullable(value: string | null | undefined): RFC | null {
    if (!value) return null;
    return this.create(value);
  }

  // ========== VALIDATION METHODS ==========

  private static isValidFormat(rfc: string): boolean {
    const patterns = [
      /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{2}[0-9A]$/, // Personas morales (13 chars)
      /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{2}[0-9A]$/, // Personas físicas (12 chars)
      /^(XAXX010101000|XEXX010101000)$/, // RFCs genéricos (SAT)
    ];

    return patterns.some((pattern) => pattern.test(rfc));
  }

  private static determineType(rfc: string): RFCType {
    if (rfc === "XAXX010101000") return "GENERICO";
    if (rfc === "XEXX010101000") return "EXTRANJERO";
    if (rfc.length === 13) return "MORAL";
    if (rfc.length === 12) return "FISICA";

    throw new InvalidRFCError(`No se pudo determinar el tipo de RFC: ${rfc}`);
  }

  // ========== BUSINESS METHODS ==========

  isGeneric(): boolean {
    return this.type === "GENERICO";
  }

  isForeign(): boolean {
    return this.type === "EXTRANJERO";
  }

  isMoral(): boolean {
    return this.type === "MORAL";
  }

  isFisica(): boolean {
    return this.type === "FISICA";
  }

  // Para Company: generalmente persona moral o genérico
  isValidForCompany(): boolean {
    return this.isMoral() || this.isGeneric();
  }

  // Para Invoice: validar que no sean iguales emisor/receptor
  canIssueTo(other: RFC): boolean {
    if (this.isGeneric() || other.isGeneric()) {
      return true;
    }
    return !this.equals(other);
  }

  // ========== UTILITY METHODS ==========

  equals(other: RFC | null): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }

  // Mantener compatibilidad con Customer
  getValue(): string | null {
    return this.value;
  }
}
