// src/core/customer/domain/value-objects/FiscalInfo.ts
import { CustomerError } from "../exceptions/CustomerError";

export interface FiscalInfoProps {
  address: string;
  street: string;
  exteriorNumber: string;
  interiorNumber?: string | null;
  neighborhood: string;
  postalCode: string;
  city: string;
  state: string;
  municipality: string;
  country?: string | null;
}

export class FiscalInfo {
  private constructor(
    private readonly address: string,
    private readonly street: string,
    private readonly exteriorNumber: string,
    private readonly interiorNumber: string | null,
    private readonly neighborhood: string,
    private readonly postalCode: string,
    private readonly city: string,
    private readonly state: string,
    private readonly municipality: string,
    private readonly country: string
  ) {}

  static create(props: FiscalInfoProps): FiscalInfo {
    // Validación: interiorNumber puede ser undefined o string → lo normalizamos a null si falta
    const interiorNumber = props.interiorNumber?.trim() || null;

    if (
      !props.address ||
      !props.street ||
      !props.exteriorNumber ||
      !props.neighborhood ||
      !props.postalCode ||
      !props.city ||
      !props.state ||
      !props.municipality
    ) {
      // Alternativa: lanzar error en vez de retornar null (mejor para errores explícitos)
      throw new CustomerError(
        "Faltan campos obligatorios en la información fiscal"
      );
    }

    if (!/^\d{5}$/.test(props.postalCode)) {
      throw new CustomerError(`Código postal inválido: ${props.postalCode}`);
    }

    return new FiscalInfo(
      props.address,
      props.street,
      props.exteriorNumber,
      interiorNumber,
      props.neighborhood,
      props.postalCode,
      props.city,
      props.state,
      props.municipality,
      props.country?.trim() || "México"
    );
  }

  getFullAddress(): string {
    let address = `${this.street} ${this.exteriorNumber}`;
    if (this.interiorNumber) {
      address += ` Int. ${this.interiorNumber}`;
    }
    address += `, ${this.neighborhood}, ${this.postalCode}, ${this.city}, ${this.state}, ${this.country}`;
    return address;
  }

  // En src/core/customer/domain/value-objects/FiscalInfo.ts
  // Agregar estos getters:

  getStreet(): string {
    return this.street;
  }

  getExteriorNumber(): string {
    return this.exteriorNumber;
  }

  getInteriorNumber(): string | null {
    return this.interiorNumber;
  }

  getNeighborhood(): string {
    return this.neighborhood;
  }

  getPostalCode(): string {
    return this.postalCode;
  }

  getCity(): string {
    return this.city;
  }

  getState(): string {
    return this.state;
  }

  getMunicipality(): string {
    return this.municipality;
  }

  getCountry(): string {
    return this.country;
  }
}
