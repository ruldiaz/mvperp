// src/core/customer/domain/Customer.ts
import { Email } from "./value-objects/Email";
import { RFC } from "./value-objects/RFC";
import { TaxInfo } from "./value-objects/TaxInfo";
import { FiscalInfo } from "./value-objects/FiscalInfo";
import {
  CustomerError,
  InvalidEmailError,
  InvalidRFCError,
} from "./exceptions/CustomerError";

// ============ INTERFACES ============
export interface CustomerProps {
  id: string;
  companyId: string;
  name: string;
  razonSocial: string;
  email: Email | null;
  phone: string | null;
  address: string | null;
  rfc: RFC | null;
  taxInfo: TaxInfo | null;
  fiscalInfo: FiscalInfo | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCustomerProps {
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

export interface CustomerPersistence {
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
  fiscalStreet: string | null;
  fiscalExteriorNumber: string | null;
  fiscalInteriorNumber: string | null;
  fiscalNeighborhood: string | null;
  fiscalPostalCode: string | null;
  fiscalCity: string | null;
  fiscalState: string | null;
  fiscalMunicipality: string | null;
  fiscalCountry: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============ ENTITY CUSTOMER ============
export class Customer {
  // Propiedades privadas para encapsulamiento
  private props: CustomerProps;

  // Constructor privado - usar factory methods
  private constructor(props: CustomerProps) {
    this.props = props;
  }

  // ============ FACTORY METHODS ============

  /**
   * Factory method para crear un nuevo Customer
   */
  static create(props: CreateCustomerProps): Customer {
    // Validar campos requeridos
    if (!props.name || props.name.trim().length < 2) {
      throw new CustomerError("El nombre debe tener al menos 2 caracteres");
    }

    if (!props.razonSocial || props.razonSocial.trim().length < 2) {
      throw new CustomerError(
        "La razón social debe tener al menos 2 caracteres"
      );
    }

    // Crear value objects
    const email = Email.create(props.email);
    const rfc = RFC.create(props.rfc);

    const taxInfo =
      props.usoCFDI && props.taxRegime
        ? TaxInfo.create(props.usoCFDI, props.taxRegime)
        : null;

    const fiscalInfo =
      props.fiscalStreet &&
      props.fiscalExteriorNumber &&
      props.fiscalNeighborhood &&
      props.fiscalPostalCode &&
      props.fiscalCity &&
      props.fiscalState &&
      props.fiscalMunicipality
        ? FiscalInfo.create({
            address: props.fiscalAddress || "",
            street: props.fiscalStreet,
            exteriorNumber: props.fiscalExteriorNumber,
            interiorNumber: props.fiscalInteriorNumber || undefined,
            neighborhood: props.fiscalNeighborhood,
            postalCode: props.fiscalPostalCode,
            city: props.fiscalCity,
            state: props.fiscalState,
            municipality: props.fiscalMunicipality,
            country: props.fiscalCountry || undefined,
          })
        : null;

    const now = new Date();

    return new Customer({
      id: crypto.randomUUID(), // Generar ID único
      companyId: props.companyId,
      name: props.name.trim(),
      razonSocial: props.razonSocial.trim(),
      email,
      phone: props.phone?.trim() || null,
      address: props.address?.trim() || null,
      rfc,
      taxInfo,
      fiscalInfo,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory method para reconstituir un Customer desde la base de datos
   */
  static reconstitute(props: CustomerProps): Customer {
    return new Customer(props);
  }

  // ============ BUSINESS METHODS ============

  /**
   * Actualizar nombre del cliente
   */
  updateName(newName: string): void {
    if (!newName || newName.trim().length < 2) {
      throw new CustomerError("El nombre debe tener al menos 2 caracteres");
    }
    this.props.name = newName.trim();
    this.props.updatedAt = new Date();
  }

  /**
   * Actualizar email
   */
  updateEmail(newEmail: string | null): void {
    try {
      this.props.email = Email.create(newEmail);
      this.props.updatedAt = new Date();
    } catch (error) {
      if (error instanceof InvalidEmailError) {
        throw error;
      }
      throw new CustomerError("Error al actualizar el email");
    }
  }

  /**
   * Actualizar RFC
   */
  updateRFC(newRFC: string | null): void {
    try {
      this.props.rfc = RFC.create(newRFC);
      this.props.updatedAt = new Date();
    } catch (error) {
      if (error instanceof InvalidRFCError) {
        throw error;
      }
      throw new CustomerError("Error al actualizar el RFC");
    }
  }

  /**
   * Actualizar información fiscal
   */
  updateFiscalInfo(
    usoCFDI: string | null,
    taxRegime: string | null,
    fiscalInfoProps?: {
      address?: string | null;
      street?: string | null;
      exteriorNumber?: string | null;
      interiorNumber?: string | null;
      neighborhood?: string | null;
      postalCode?: string | null;
      city?: string | null;
      state?: string | null;
      municipality?: string | null;
      country?: string | null;
    } | null // ← Aceptar null también
  ): void {
    // Manejar taxInfo (ambos deben ser proporcionados para crear TaxInfo)
    if (usoCFDI && taxRegime) {
      this.props.taxInfo = TaxInfo.create(usoCFDI, taxRegime);
    } else if (usoCFDI === null && taxRegime === null) {
      // Ambos son null → eliminar taxInfo
      this.props.taxInfo = null;
    } else if (usoCFDI !== undefined || taxRegime !== undefined) {
      // Solo uno fue proporcionado → error
      throw new CustomerError("Debe proporcionar tanto usoCFDI como taxRegime");
    }
    // Si ambos son undefined, no hacemos cambios

    // Manejar fiscalInfo
    if (fiscalInfoProps !== null && fiscalInfoProps !== undefined) {
      const {
        address,
        street,
        exteriorNumber,
        interiorNumber,
        neighborhood,
        postalCode,
        city,
        state,
        municipality,
        country,
      } = fiscalInfoProps;

      // Si todos los campos obligatorios están presentes, crear FiscalInfo
      if (
        street &&
        exteriorNumber &&
        neighborhood &&
        postalCode &&
        city &&
        state &&
        municipality
      ) {
        this.props.fiscalInfo = FiscalInfo.create({
          address: address || "",
          street,
          exteriorNumber,
          interiorNumber: interiorNumber || undefined,
          neighborhood,
          postalCode,
          city,
          state,
          municipality,
          country: country || undefined,
        });
      } else if (
        // Si todos los campos obligatorios son null, eliminar fiscalInfo
        street === null &&
        exteriorNumber === null &&
        neighborhood === null &&
        postalCode === null &&
        city === null &&
        state === null &&
        municipality === null
      ) {
        this.props.fiscalInfo = null;
      }
      // Si algunos campos son undefined (no proporcionados), no hacemos cambios
    } else if (fiscalInfoProps === null) {
      // fiscalInfoProps es null explícitamente → eliminar fiscalInfo
      this.props.fiscalInfo = null;
    }

    this.props.updatedAt = new Date();
  }

  updatePhone(newPhone: string | null): void {
    this.props.phone = newPhone?.trim() || null;
    this.props.updatedAt = new Date();
  }

  updateAddress(newAddress: string | null): void {
    this.props.address = newAddress?.trim() || null;
    this.props.updatedAt = new Date();
  }

  updateRazonSocial(newRazonSocial: string): void {
    if (!newRazonSocial || newRazonSocial.trim().length < 2) {
      throw new CustomerError(
        "La razón social debe tener al menos 2 caracteres"
      );
    }
    this.props.razonSocial = newRazonSocial.trim();
    this.props.updatedAt = new Date();
  }

  /**
   * Validar si el cliente puede recibir facturas
   */
  canReceiveInvoices(): boolean {
    return !!this.props.rfc && !!this.props.taxInfo && !!this.props.fiscalInfo;
  }

  /**
   * Obtener errores de validación para facturación
   */
  getInvoiceValidationErrors(): string[] {
    const errors: string[] = [];

    if (!this.props.rfc) {
      errors.push("RFC es requerido para facturación");
    }

    if (!this.props.taxInfo) {
      errors.push("Información fiscal (uso CFDI y régimen) es requerida");
    }

    if (!this.props.fiscalInfo) {
      errors.push("Domicilio fiscal completo es requerido");
    }

    return errors;
  }

  // ============ GETTERS ============

  getId(): string {
    return this.props.id;
  }

  getCompanyId(): string {
    return this.props.companyId;
  }

  getName(): string {
    return this.props.name;
  }

  getRazonSocial(): string {
    return this.props.razonSocial;
  }

  getEmail(): string | null {
    return this.props.email?.getValue() || null;
  }

  getPhone(): string | null {
    return this.props.phone;
  }

  getAddress(): string | null {
    return this.props.address;
  }

  getRFC(): string | null {
    return this.props.rfc?.getValue() || null;
  }

  getUsoCFDI(): string | null {
    return this.props.taxInfo?.getUsoCFDI() || null;
  }

  getTaxRegime(): string | null {
    return this.props.taxInfo?.getTaxRegime() || null;
  }

  getFiscalAddress(): string | null {
    return this.props.fiscalInfo?.getFullAddress() || null;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  // ============ GETTERS PARA VALUE OBJECTS (uso interno) ============

  getEmailVO(): Email | null {
    return this.props.email;
  }

  getRFCVO(): RFC | null {
    return this.props.rfc;
  }

  getTaxInfoVO(): TaxInfo | null {
    return this.props.taxInfo;
  }

  getFiscalInfoVO(): FiscalInfo | null {
    return this.props.fiscalInfo;
  }

  getFiscalStreet(): string | null {
    return this.props.fiscalInfo?.getStreet() || null;
  }

  getFiscalExteriorNumber(): string | null {
    return this.props.fiscalInfo?.getExteriorNumber() || null;
  }

  getFiscalInteriorNumber(): string | null {
    return this.props.fiscalInfo?.getInteriorNumber() || null;
  }

  getFiscalNeighborhood(): string | null {
    return this.props.fiscalInfo?.getNeighborhood() || null;
  }

  getFiscalPostalCode(): string | null {
    return this.props.fiscalInfo?.getPostalCode() || null;
  }

  getFiscalCity(): string | null {
    return this.props.fiscalInfo?.getCity() || null;
  }

  getFiscalState(): string | null {
    return this.props.fiscalInfo?.getState() || null;
  }

  getFiscalMunicipality(): string | null {
    return this.props.fiscalInfo?.getMunicipality() || null;
  }

  getFiscalCountry(): string | null {
    return this.props.fiscalInfo?.getCountry() || null;
  }

  // ============ MÉTODOS PARA PERSISTENCIA ============

  /**
   * Serializar para persistencia
   */
  toPersistence(): CustomerPersistence {
    return {
      id: this.props.id,
      companyId: this.props.companyId,
      name: this.props.name,
      razonSocial: this.props.razonSocial,
      email: this.props.email?.getValue() || null,
      phone: this.props.phone,
      address: this.props.address,
      rfc: this.props.rfc?.getValue() || null,
      usoCFDI: this.props.taxInfo?.getUsoCFDI() || null,
      taxRegime: this.props.taxInfo?.getTaxRegime() || null,
      fiscalAddress: this.props.fiscalInfo?.getFullAddress() || null,
      fiscalStreet: this.props.fiscalInfo?.getStreet() || null,
      fiscalExteriorNumber: this.props.fiscalInfo?.getExteriorNumber() || null,
      fiscalInteriorNumber: this.props.fiscalInfo?.getInteriorNumber() || null,
      fiscalNeighborhood: this.props.fiscalInfo?.getNeighborhood() || null,
      fiscalPostalCode: this.props.fiscalInfo?.getPostalCode() || null,
      fiscalCity: this.props.fiscalInfo?.getCity() || null,
      fiscalState: this.props.fiscalInfo?.getState() || null,
      fiscalMunicipality: this.props.fiscalInfo?.getMunicipality() || null,
      fiscalCountry: this.props.fiscalInfo?.getCountry() || null,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  /**
   * Comparar igualdad entre Customers
   */
  equals(other: Customer | null): boolean {
    if (!other) return false;
    return (
      this.props.id === other.props.id &&
      this.props.companyId === other.props.companyId
    );
  }
}
