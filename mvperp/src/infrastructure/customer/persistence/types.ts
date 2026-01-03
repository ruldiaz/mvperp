// src/infrastructure/customer/persistence/types.ts
import { Prisma } from "@prisma/client";

/**
 * Tipo para representar un Customer de Prisma
 */
export type PrismaCustomer = Prisma.CustomerGetPayload<{
  select: {
    id: true;
    companyId: true;
    name: true;
    razonSocial: true;
    email: true;
    phone: true;
    address: true;
    rfc: true;
    usoCFDI: true;
    taxRegime: true;
    fiscalAddress: true;
    fiscalStreet: true;
    fiscalExteriorNumber: true;
    fiscalInteriorNumber: true;
    fiscalNeighborhood: true;
    fiscalPostalCode: true;
    fiscalCity: true;
    fiscalState: true;
    fiscalMunicipality: true;
    fiscalCountry: true;
    createdAt: true;
    updatedAt: true;
  };
}>;

/**
 * Tipo para crear/actualizar Customer en Prisma
 */
export type PrismaCustomerInput =
  | Prisma.CustomerCreateInput
  | Prisma.CustomerUpdateInput;
