// src/core/customer/application/dtos/CustomerMapper.ts
import { Customer } from "../../domain/Customer";
import { CreateCustomerDTO, CustomerDTO } from "./CustomerDTO";

/**
 * Mapper para convertir entre Entity y DTO
 * Mantiene separación entre dominio y presentación
 */
export class CustomerMapper {
  /**
   * Convertir Entity a DTO
   */
  static toDTO(customer: Customer): CustomerDTO {
    return {
      id: customer.getId(),
      companyId: customer.getCompanyId(),
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
  }

  /**
   * Convertir múltiples Entities a DTOs
   */
  static toDTOs(customers: Customer[]): CustomerDTO[] {
    return customers.map((customer) => this.toDTO(customer));
  }

  /**
   * Convertir DTO de creación a props para Entity
   */
  static toCreateProps(dto: CreateCustomerDTO) {
    return {
      companyId: dto.companyId,
      name: dto.name,
      razonSocial: dto.razonSocial,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      rfc: dto.rfc,
      usoCFDI: dto.usoCFDI,
      taxRegime: dto.taxRegime,
      fiscalAddress: dto.fiscalAddress,
      fiscalStreet: dto.fiscalStreet,
      fiscalExteriorNumber: dto.fiscalExteriorNumber,
      fiscalInteriorNumber: dto.fiscalInteriorNumber,
      fiscalNeighborhood: dto.fiscalNeighborhood,
      fiscalPostalCode: dto.fiscalPostalCode,
      fiscalCity: dto.fiscalCity,
      fiscalState: dto.fiscalState,
      fiscalMunicipality: dto.fiscalMunicipality,
      fiscalCountry: dto.fiscalCountry,
    };
  }
}
