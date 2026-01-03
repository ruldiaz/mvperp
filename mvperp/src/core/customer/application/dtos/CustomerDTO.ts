// src/core/customer/application/dtos/CustomerDTO.ts

/**
 * DTO para representar un Customer en respuestas API
 * Expone solo lo necesario, no toda la entidad
 */
export interface CustomerDTO {
  id: string;
  companyId: string;
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
 * DTO para creación de Customer
 */
export interface CreateCustomerDTO {
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
 * DTO para actualización de Customer
 */
export interface UpdateCustomerDTO extends Partial<CreateCustomerDTO> {
  id: string;
}

/**
 * DTO para respuestas paginadas
 */
export interface PaginatedCustomerResponse {
  customers: CustomerDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
