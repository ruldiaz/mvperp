// src/core/customer/application/use-cases/CreateCustomerUseCase.ts
import { Customer } from "../../domain/Customer";
import { ICustomerRepository } from "../ports/ICustomerRepository";

import {
  CustomerError,
  InvalidEmailError,
  InvalidRFCError,
} from "../../domain/exceptions/CustomerError";

/**
 * Input para el caso de uso CreateCustomer
 */
export interface CreateCustomerInput {
  companyId: string;
  name: string;
  razonSocial: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  rfc?: string | null;
  usoCFDI?: string | null;
  taxRegime?: string | null;
  fiscalAddress?: string | null;
  fiscalStreet?: string | null;
  fiscalExteriorNumber?: string | null;
  fiscalInteriorNumber?: string | null;
  fiscalNeighborhood?: string | null;
  fiscalPostalCode?: string | null;
  fiscalCity?: string | null;
  fiscalState?: string | null;
  fiscalMunicipality?: string | null;
  fiscalCountry?: string | null;
}

/**
 * Output para el caso de uso CreateCustomer
 */
export interface CreateCustomerOutput {
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
}

/**
 * Caso de uso: Crear un nuevo cliente
 *
 * Responsabilidades:
 * 1. Validar reglas de negocio de aplicación
 * 2. Orquestar la creación de la entidad
 * 3. Persistir a través del repositorio
 * 4. Manejar errores de dominio
 */
export class CreateCustomerUseCase {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  /**
   * Ejecutar el caso de uso
   */
  async execute(input: CreateCustomerInput): Promise<CreateCustomerOutput> {
    try {
      // 1. VALIDACIONES DE APLICACIÓN (reglas que involucran repositorio)

      // Validar unicidad de email (si se proporciona)
      if (input.email) {
        const emailExists = await this.customerRepository.emailExists(
          input.email,
          input.companyId
        );

        if (emailExists) {
          throw new CustomerError(
            `El email ${input.email} ya está registrado en esta compañía`
          );
        }
      }

      // Validar unicidad de RFC (si se proporciona)
      if (input.rfc) {
        const rfcExists = await this.customerRepository.rfcExists(
          input.rfc,
          input.companyId
        );

        if (rfcExists) {
          throw new CustomerError(
            `El RFC ${input.rfc} ya está registrado en esta compañía`
          );
        }
      }

      // 2. CREAR LA ENTIDAD (las validaciones básicas están en la Entity)
      const customer = Customer.create({
        companyId: input.companyId,
        name: input.name,
        razonSocial: input.razonSocial,
        email: input.email,
        phone: input.phone,
        address: input.address,
        rfc: input.rfc,
        usoCFDI: input.usoCFDI,
        taxRegime: input.taxRegime,
        fiscalAddress: input.fiscalAddress,
        fiscalStreet: input.fiscalStreet,
        fiscalExteriorNumber: input.fiscalExteriorNumber,
        fiscalInteriorNumber: input.fiscalInteriorNumber,
        fiscalNeighborhood: input.fiscalNeighborhood,
        fiscalPostalCode: input.fiscalPostalCode,
        fiscalCity: input.fiscalCity,
        fiscalState: input.fiscalState,
        fiscalMunicipality: input.fiscalMunicipality,
        fiscalCountry: input.fiscalCountry,
      });

      // 3. PERSISTIR LA ENTIDAD
      await this.customerRepository.save(customer);

      // 4. RETORNAR OUTPUT
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
      };
    } catch (error) {
      // Manejar errores específicos de dominio
      if (
        error instanceof CustomerError ||
        error instanceof InvalidEmailError ||
        error instanceof InvalidRFCError
      ) {
        throw error; // Re-lanzar errores de dominio
      }

      // Convertir errores genéricos
      console.error("Error en CreateCustomerUseCase:", error);
      throw new CustomerError("Error al crear el cliente");
    }
  }
}
