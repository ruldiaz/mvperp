// src/core/customer/application/use-cases/GetCustomerUseCase.ts
import { ICustomerRepository } from "../ports/ICustomerRepository";
import { CustomerError } from "../../domain/exceptions/CustomerError";

export interface GetCustomerInput {
  id: string;
  companyId: string;
}

export interface GetCustomerOutput {
  id: string;
  name: string;
  razonSocial: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  rfc: string | null;
  usoCFDI: string | null;
  taxRegime: string | null;
  fiscalAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
  canReceiveInvoices: boolean;
  invoiceValidationErrors: string[];
}

export class GetCustomerUseCase {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  async execute(input: GetCustomerInput): Promise<GetCustomerOutput> {
    try {
      const customer = await this.customerRepository.findById(
        input.id,
        input.companyId
      );

      if (!customer) {
        throw new CustomerError("Cliente no encontrado");
      }

      return {
        id: customer.getId(),
        name: customer.getName(),
        razonSocial: customer.getRazonSocial(),
        email: customer.getEmail(),
        phone: customer.getPhone(),
        address: customer.getAddress(),
        rfc: customer.getRFC(),
        usoCFDI: customer.getUsoCFDI(),
        taxRegime: customer.getTaxRegime(),
        fiscalAddress: customer.getFiscalAddress(),
        createdAt: customer.getCreatedAt(),
        updatedAt: customer.getUpdatedAt(),
        canReceiveInvoices: customer.canReceiveInvoices(),
        invoiceValidationErrors: customer.getInvoiceValidationErrors(),
      };
    } catch (error) {
      if (error instanceof CustomerError) {
        throw error;
      }

      console.error("Error en GetCustomerUseCase:", error);
      throw new CustomerError("Error al obtener el cliente");
    }
  }
}
