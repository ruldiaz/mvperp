// src/core/customer/interfaces/index.ts
/**
 * Public API del módulo Customer
 * Expone solo lo necesario para otros módulos
 */

// Domain
export { Customer } from "../domain/Customer";
export type { CustomerProps, CreateCustomerProps } from "../domain/Customer";

// Application Ports
export type {
  ICustomerRepository,
  CustomerFilters,
  PaginatedResult,
} from "../application/ports/ICustomerRepository";

// DTOs
export type {
  CustomerDTO,
  CreateCustomerDTO,
  UpdateCustomerDTO,
  PaginatedCustomerResponse,
} from "../application/dtos/CustomerDTO";
export { CustomerMapper } from "../application/dtos/CustomerMapper";

// Exceptions
export {
  CustomerError,
  InvalidEmailError,
  InvalidRFCError,
} from "../domain/exceptions/CustomerError";

// Use Cases
export {
  CreateCustomerUseCase,
  GetCustomerUseCase,
  GetCustomersUseCase,
} from "../application/use-cases";
export type {
  CreateCustomerInput,
  CreateCustomerOutput,
  GetCustomerInput,
  GetCustomerOutput,
  GetCustomersInput,
  GetCustomersOutput,
} from "../application/use-cases";
