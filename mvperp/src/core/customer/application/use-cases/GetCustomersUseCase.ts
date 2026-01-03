// src/core/customer/application/use-cases/GetCustomersUseCase.ts
import {
  ICustomerRepository,
  CustomerFilters,
  PaginatedResult,
} from "../ports/ICustomerRepository";
import { Customer } from "../../domain/Customer";
import { CustomerError } from "../../domain/exceptions/CustomerError";

export interface GetCustomersInput {
  companyId: string;
  filters?: CustomerFilters;
}

export interface GetCustomersOutput {
  customers: Array<{
    id: string;
    name: string;
    razonSocial: string;
    email: string | null;
    phone: string | null;
    rfc: string | null;
    createdAt: Date;
    canReceiveInvoices: boolean;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class GetCustomersUseCase {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  async execute(input: GetCustomersInput): Promise<GetCustomersOutput> {
    try {
      // Especificar que el PaginatedResult contiene Customer entities
      const result: PaginatedResult<Customer> =
        await this.customerRepository.findAll(input.companyId, input.filters);

      // Convertir entities a DTOs ligeros para la lista
      const customers = result.data.map((customer) => ({
        id: customer.getId(),
        name: customer.getName(),
        razonSocial: customer.getRazonSocial(),
        email: customer.getEmail(),
        phone: customer.getPhone(),
        rfc: customer.getRFC(),
        createdAt: customer.getCreatedAt(),
        canReceiveInvoices: customer.canReceiveInvoices(),
      }));

      return {
        customers,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      };
    } catch (error) {
      console.error("Error en GetCustomersUseCase:", error);
      throw new CustomerError("Error al obtener los clientes");
    }
  }
}
