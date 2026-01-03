// src/core/customer/domain/exceptions/CustomerError.ts

export class CustomerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomerError";
  }
}

export class InvalidEmailError extends CustomerError {
  constructor(email: string) {
    super(`Email inválido: ${email}`);
    this.name = "InvalidEmailError";
  }
}

export class InvalidRFCError extends CustomerError {
  constructor(rfc: string) {
    super(`RFC inválido: ${rfc}`);
    this.name = "InvalidRFCError";
  }
}

export class CustomerAlreadyExistsError extends CustomerError {
  constructor(email: string) {
    super(`Cliente con email ${email} ya existe`);
    this.name = "CustomerAlreadyExistsError";
  }
}
