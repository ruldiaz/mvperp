// src/core/customer/application/use-cases/UpdateCustomerUseCase.ts
import { ICustomerRepository } from "../ports/ICustomerRepository";
import { CustomerError } from "../../domain/exceptions/CustomerError";

export interface UpdateCustomerInput {
  id: string;
  companyId: string;
  name?: string;
  razonSocial?: string;
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

export interface UpdateCustomerOutput {
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
  updatedAt: Date;
}

export class UpdateCustomerUseCase {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  async execute(input: UpdateCustomerInput): Promise<UpdateCustomerOutput> {
    try {
      // 1. Buscar cliente existente
      const customer = await this.customerRepository.findById(
        input.id,
        input.companyId
      );

      if (!customer) {
        throw new CustomerError("Cliente no encontrado");
      }

      // 2. Validar unicidad de email (si se está actualizando)
      if (input.email !== undefined) {
        // Solo validar si email no es null
        if (input.email !== null) {
          const emailExists = await this.customerRepository.emailExists(
            input.email, // Ahora es string, no string | null
            input.companyId,
            input.id
          );
          if (emailExists) {
            throw new CustomerError(
              `El email ${input.email} ya está registrado`
            );
          }
        }
        // Si email es null, no necesitamos validar unicidad
      }

      // 3. Validar unicidad de RFC (si se está actualizando)
      if (input.rfc !== undefined) {
        // Solo validar si RFC no es null
        if (input.rfc !== null) {
          const rfcExists = await this.customerRepository.rfcExists(
            input.rfc, // Ahora es string, no string | null
            input.companyId,
            input.id
          );
          if (rfcExists) {
            throw new CustomerError(`El RFC ${input.rfc} ya está registrado`);
          }
        }
      }

      // 4. Aplicar actualizaciones con manejo de null
      if (input.name !== undefined) customer.updateName(input.name);
      if (input.email !== undefined) customer.updateEmail(input.email);
      if (input.rfc !== undefined) customer.updateRFC(input.rfc);
      if (input.phone !== undefined) customer.updatePhone(input.phone);
      if (input.address !== undefined) customer.updateAddress(input.address);
      if (input.razonSocial !== undefined)
        customer.updateRazonSocial(input.razonSocial);

      // 5. Actualizar información fiscal si se proporciona
      if (input.usoCFDI !== undefined || input.taxRegime !== undefined) {
        // Convertir undefined a null para los métodos
        const usoCFDI = input.usoCFDI !== undefined ? input.usoCFDI : null;
        const taxRegime =
          input.taxRegime !== undefined ? input.taxRegime : null;

        customer.updateFiscalInfo(usoCFDI, taxRegime, {
          address:
            input.fiscalAddress !== undefined ? input.fiscalAddress : null,
          street: input.fiscalStreet !== undefined ? input.fiscalStreet : null,
          exteriorNumber:
            input.fiscalExteriorNumber !== undefined
              ? input.fiscalExteriorNumber
              : null,
          interiorNumber:
            input.fiscalInteriorNumber !== undefined
              ? input.fiscalInteriorNumber
              : null,
          neighborhood:
            input.fiscalNeighborhood !== undefined
              ? input.fiscalNeighborhood
              : null,
          postalCode:
            input.fiscalPostalCode !== undefined
              ? input.fiscalPostalCode
              : null,
          city: input.fiscalCity !== undefined ? input.fiscalCity : null,
          state: input.fiscalState !== undefined ? input.fiscalState : null,
          municipality:
            input.fiscalMunicipality !== undefined
              ? input.fiscalMunicipality
              : null,
          country:
            input.fiscalCountry !== undefined ? input.fiscalCountry : null,
        });
      }

      // 6. Persistir cambios
      await this.customerRepository.update(customer);

      // 7. Retornar resultado
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
        updatedAt: customer.getUpdatedAt(),
      };
    } catch (error) {
      if (error instanceof CustomerError) {
        throw error;
      }
      console.error("Error en UpdateCustomerUseCase:", error);
      throw new CustomerError("Error al actualizar el cliente");
    }
  }
}
