// src/core/customer/application/use-cases/index.ts
/**
 * Exportación de todos los casos de uso del módulo Customer
 */

// Create
export { CreateCustomerUseCase } from "./CreateCustomerUseCase";
export type {
  CreateCustomerInput,
  CreateCustomerOutput,
} from "./CreateCustomerUseCase";

// Get
export { GetCustomerUseCase } from "./GetCustomerUseCase";
export type { GetCustomerInput, GetCustomerOutput } from "./GetCustomerUseCase";

// Get All (paginado)
export { GetCustomersUseCase } from "./GetCustomersUseCase";
export type {
  GetCustomersInput,
  GetCustomersOutput,
} from "./GetCustomersUseCase";

// Update (para implementar después)
// Delete (para implementar después)
export { UpdateCustomerUseCase } from "./UpdateCustomerUseCase";
export type {
  UpdateCustomerInput,
  UpdateCustomerOutput,
} from "./UpdateCustomerUseCase";

export { DeleteCustomerUseCase } from "./DeleteCustomerUseCase";
export type {
  DeleteCustomerInput,
  DeleteCustomerOutput,
} from "./DeleteCustomerUseCase";
