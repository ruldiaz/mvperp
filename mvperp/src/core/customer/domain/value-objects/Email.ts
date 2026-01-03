// src/core/customer/domain/value-objects/Email.ts
import { InvalidEmailError } from "../exceptions/CustomerError";

export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string | null | undefined): Email | null {
    if (!email) return null;

    const trimmed = email.trim().toLowerCase();
    if (!this.isValid(trimmed)) {
      throw new InvalidEmailError(email);
    }

    return new Email(trimmed);
  }

  private static isValid(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  getValue(): string | null {
    return this.value;
  }

  equals(other: Email | null): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
