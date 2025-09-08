// src/types/customer.ts
export interface Customer {
  id?: string;
  name: string;
  razonSocial?: string;
  email?: string;
  phone?: string;
  address?: string;
  rfc?: string;
  usoCFDI?: string;
  taxRegime?: string;
  fiscalAddress?: string;
  fiscalStreet?: string;
  fiscalExteriorNumber?: string;
  fiscalInteriorNumber?: string;
  fiscalNeighborhood?: string;
  fiscalPostalCode?: string;
  fiscalCity?: string;
  fiscalState?: string;
  fiscalMunicipality?: string;
  fiscalCountry?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CreateCustomerRequest {
  name: string;
  razonSocial?: string;
  email?: string;
  phone?: string;
  address?: string;
  rfc?: string;
  usoCFDI?: string;
  taxRegime?: string;
  fiscalAddress?: string;
  fiscalStreet?: string;
  fiscalExteriorNumber?: string;
  fiscalInteriorNumber?: string;
  fiscalNeighborhood?: string;
  fiscalPostalCode?: string;
  fiscalCity?: string;
  fiscalState?: string;
  fiscalMunicipality?: string;
  fiscalCountry?: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {
  id: string;
}
