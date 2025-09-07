// types/company.ts
export interface Company {
  id: string;
  name: string;
  rfc: string;
  regime: string;

  // Certificado Digital (opcionales en Prisma)
  csdCert?: string | null;
  csdKey?: string | null;
  csdPassword?: string | null;

  // Domicilio Fiscal (requeridos en Prisma)
  street: string;
  exteriorNumber: string;
  interiorNumber?: string | null;
  neighborhood: string;
  postalCode: string;
  city: string;
  state: string;
  municipality: string;
  country?: string | null; // Opcional en Prisma con valor por defecto

  // Contacto (opcionales en Prisma)
  email?: string | null;
  phone?: string | null;

  // Configuración PAC (opcionales en Prisma)
  pac?: string | null;
  pacUser?: string | null;
  pacPass?: string | null;
  testMode: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyResponse {
  company: Company | null;
  error?: string;
}

export interface CompanyFormData {
  name: string;
  rfc: string;
  regime: string;
  street: string;
  exteriorNumber: string;
  interiorNumber?: string | null;
  neighborhood: string;
  postalCode: string;
  city: string;
  state: string;
  municipality: string;
  country?: string;
  email?: string;
  phone?: string;
  pac?: string;
  pacUser?: string;
  pacPass?: string;
  testMode: boolean;
}

export interface CompanyResponse {
  company: Company | null;
  error?: string;
}

export interface RegimenFiscal {
  value: string;
  label: string;
}

export const REGIMENES_FISCALES: RegimenFiscal[] = [
  { value: "601", label: "601 - General de Ley Personas Morales" },
  { value: "603", label: "603 - Personas Morales con Fines no Lucrativos" },
  { value: "605", label: "605 - Sueldos y Salarios" },
  { value: "606", label: "606 - Arrendamiento" },
  {
    value: "607",
    label: "607 - Régimen de Enajenación o Adquisición de Bienes",
  },
  { value: "608", label: "608 - Demás ingresos" },
  {
    value: "610",
    label:
      "610 - Residentes en el Extranjero sin Establecimiento Permanente en México",
  },
  {
    value: "611",
    label: "611 - Ingresos por Dividendos (socios y accionistas)",
  },
  {
    value: "612",
    label:
      "612 - Personas Físicas con Actividades Empresariales y Profesionales",
  },
  { value: "614", label: "614 - Ingresos por intereses" },
  {
    value: "615",
    label: "615 - Régimen de los ingresos por obtención de premios",
  },
  { value: "616", label: "616 - Sin obligaciones fiscales" },
  {
    value: "620",
    label:
      "620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos",
  },
  { value: "621", label: "621 - Incorporación Fiscal" },
  {
    value: "622",
    label: "622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras",
  },
  { value: "623", label: "623 - Opcional para Grupos de Sociedades" },
  { value: "624", label: "624 - Coordinados" },
  {
    value: "625",
    label:
      "625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas",
  },
  { value: "626", label: "626 - Régimen Simplificado de Confianza" },
];

export interface PACOption {
  value: string;
  label: string;
}

export const PAC_OPTIONS: PACOption[] = [
  { value: "SW", label: "SW (Servicios Web)" },
  { value: "Facturama", label: "Facturama" },
  { value: "Other", label: "Otro" },
];

// Tipo que genera Prisma para Company (basado en tu schema)
export type PrismaCompany = {
  id: string;
  name: string;
  rfc: string;
  regime: string;
  csdCert: string | null;
  csdKey: string | null;
  csdPassword: string | null;
  street: string;
  exteriorNumber: string;
  interiorNumber: string | null; // Cambiado a opcional para coincidir con Prisma
  neighborhood: string;
  postalCode: string;
  city: string;
  state: string;
  municipality: string;
  country: string | null;
  email: string | null;
  phone: string | null;
  pac: string | null;
  pacUser: string | null;
  pacPass: string | null;
  testMode: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// También asegúrate de que la función de mapeo maneje correctamente los valores null
export function mapPrismaCompanyToCompany(
  prismaCompany: PrismaCompany | null
): Company | null {
  if (!prismaCompany) return null;

  return {
    id: prismaCompany.id,
    name: prismaCompany.name,
    rfc: prismaCompany.rfc,
    regime: prismaCompany.regime,
    csdCert: prismaCompany.csdCert,
    csdKey: prismaCompany.csdKey,
    csdPassword: prismaCompany.csdPassword,
    street: prismaCompany.street,
    exteriorNumber: prismaCompany.exteriorNumber,
    interiorNumber: prismaCompany.interiorNumber, // Esto debería funcionar ahora
    neighborhood: prismaCompany.neighborhood,
    postalCode: prismaCompany.postalCode,
    city: prismaCompany.city,
    state: prismaCompany.state,
    municipality: prismaCompany.municipality,
    country: prismaCompany.country,
    email: prismaCompany.email,
    phone: prismaCompany.phone,
    pac: prismaCompany.pac,
    pacUser: prismaCompany.pacUser,
    pacPass: prismaCompany.pacPass,
    testMode: prismaCompany.testMode,
    createdAt: prismaCompany.createdAt,
    updatedAt: prismaCompany.updatedAt,
  };
}
