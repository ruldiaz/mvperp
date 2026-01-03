// src/core/customer/domain/value-objects/RFC.ts
import { InvalidRFCError } from "../exceptions/CustomerError";

export class RFC {
  private constructor(private readonly value: string) {}

  static create(rfc: string | null | undefined): RFC | null {
    if (!rfc) return null;

    const trimmed = rfc.trim().toUpperCase();
    if (!this.isValid(trimmed)) {
      throw new InvalidRFCError(rfc);
    }

    return new RFC(trimmed);
  }

  private static isValid(rfc: string): boolean {
    const pattern = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
    return pattern.test(rfc);
  }

  getValue(): string | null {
    return this.value;
  }

  equals(other: RFC | null): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
