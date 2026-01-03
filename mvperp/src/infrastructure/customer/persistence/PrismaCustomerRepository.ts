// src/infrastructure/customer/persistence/PrismaCustomerRepository.ts
import {
  ICustomerRepository,
  CustomerFilters,
  PaginatedResult,
} from "@/core/customer/application/ports/ICustomerRepository";
import { Customer, CustomerProps } from "@/core/customer/domain/Customer";
import { Email } from "@/core/customer/domain/value-objects/Email";
import { RFC } from "@/core/customer/domain/value-objects/RFC";
import { TaxInfo } from "@/core/customer/domain/value-objects/TaxInfo";
import { FiscalInfo } from "@/core/customer/domain/value-objects/FiscalInfo";
import { prisma } from "./PrismaClient";
import { Prisma } from "@prisma/client";
import { PrismaCustomer } from "./types";

export class PrismaCustomerRepository implements ICustomerRepository {
  // ============ MÉTODOS DE CONVERSIÓN ============

  /**
   * Convertir Prisma model a Customer Entity
   */
  private toEntity(prismaCustomer: PrismaCustomer): Customer {
    // Mapear value objects
    const email = prismaCustomer.email
      ? Email.create(prismaCustomer.email)
      : null;

    const rfc = prismaCustomer.rfc ? RFC.create(prismaCustomer.rfc) : null;

    const taxInfo =
      prismaCustomer.usoCFDI && prismaCustomer.taxRegime
        ? TaxInfo.create(prismaCustomer.usoCFDI, prismaCustomer.taxRegime)
        : null;

    const fiscalInfo =
      prismaCustomer.fiscalStreet &&
      prismaCustomer.fiscalExteriorNumber &&
      prismaCustomer.fiscalNeighborhood &&
      prismaCustomer.fiscalPostalCode &&
      prismaCustomer.fiscalCity &&
      prismaCustomer.fiscalState &&
      prismaCustomer.fiscalMunicipality
        ? FiscalInfo.create({
            address: prismaCustomer.fiscalAddress || "",
            street: prismaCustomer.fiscalStreet,
            exteriorNumber: prismaCustomer.fiscalExteriorNumber,
            interiorNumber: prismaCustomer.fiscalInteriorNumber,
            neighborhood: prismaCustomer.fiscalNeighborhood,
            postalCode: prismaCustomer.fiscalPostalCode,
            city: prismaCustomer.fiscalCity,
            state: prismaCustomer.fiscalState,
            municipality: prismaCustomer.fiscalMunicipality,
            country: prismaCustomer.fiscalCountry,
          })
        : null;

    const props: CustomerProps = {
      id: prismaCustomer.id,
      companyId: prismaCustomer.companyId,
      name: prismaCustomer.name,
      razonSocial: prismaCustomer.razonSocial || "",
      email,
      phone: prismaCustomer.phone,
      address: prismaCustomer.address,
      rfc,
      taxInfo,
      fiscalInfo,
      createdAt: prismaCustomer.createdAt,
      updatedAt: prismaCustomer.updatedAt,
    };

    return Customer.reconstitute(props);
  }

  /**
   * Convertir Customer Entity a objeto para Prisma
   */
  private toPrismaCreate(customer: Customer): Prisma.CustomerCreateInput {
    return {
      id: customer.getId(),
      company: {
        connect: {
          id: customer.getCompanyId(),
        },
      },
      name: customer.getName(),
      razonSocial: customer.getRazonSocial(),
      email: customer.getEmail(),
      phone: customer.getPhone(),
      address: customer.getAddress(),
      rfc: customer.getRFC(),
      usoCFDI: customer.getUsoCFDI(),
      taxRegime: customer.getTaxRegime(),
      fiscalAddress: customer.getFiscalAddress(),
      fiscalStreet: customer.getFiscalStreet(),
      fiscalExteriorNumber: customer.getFiscalExteriorNumber(),
      fiscalInteriorNumber: customer.getFiscalInteriorNumber(),
      fiscalNeighborhood: customer.getFiscalNeighborhood(),
      fiscalPostalCode: customer.getFiscalPostalCode(),
      fiscalCity: customer.getFiscalCity(),
      fiscalState: customer.getFiscalState(),
      fiscalMunicipality: customer.getFiscalMunicipality(),
      fiscalCountry: customer.getFiscalCountry(),
      createdAt: customer.getCreatedAt(),
      updatedAt: customer.getUpdatedAt(),
    };
  }

  /**
   * Convertir Customer Entity a objeto para actualización en Prisma
   */
  private toPrismaUpdate(customer: Customer): Prisma.CustomerUpdateInput {
    return {
      name: customer.getName(),
      razonSocial: customer.getRazonSocial(),
      email: customer.getEmail(),
      phone: customer.getPhone(),
      address: customer.getAddress(),
      rfc: customer.getRFC(),
      usoCFDI: customer.getUsoCFDI(),
      taxRegime: customer.getTaxRegime(),
      fiscalAddress: customer.getFiscalAddress(),
      fiscalStreet: customer.getFiscalStreet(),
      fiscalExteriorNumber: customer.getFiscalExteriorNumber(),
      fiscalInteriorNumber: customer.getFiscalInteriorNumber(),
      fiscalNeighborhood: customer.getFiscalNeighborhood(),
      fiscalPostalCode: customer.getFiscalPostalCode(),
      fiscalCity: customer.getFiscalCity(),
      fiscalState: customer.getFiscalState(),
      fiscalMunicipality: customer.getFiscalMunicipality(),
      fiscalCountry: customer.getFiscalCountry(),
      updatedAt: customer.getUpdatedAt(),
    };
  }

  // ============ IMPLEMENTACIÓN DE ICustomerRepository ============

  async save(customer: Customer): Promise<void> {
    const data = this.toPrismaCreate(customer);

    await prisma.customer.create({
      data: {
        ...data,
        // Asegurar que los campos opcionales sean null si no existen
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        rfc: data.rfc || null,
        usoCFDI: data.usoCFDI || null,
        taxRegime: data.taxRegime || null,
        fiscalAddress: data.fiscalAddress || null,
        fiscalStreet: data.fiscalStreet || null,
        fiscalExteriorNumber: data.fiscalExteriorNumber || null,
        fiscalInteriorNumber: data.fiscalInteriorNumber || null,
        fiscalNeighborhood: data.fiscalNeighborhood || null,
        fiscalPostalCode: data.fiscalPostalCode || null,
        fiscalCity: data.fiscalCity || null,
        fiscalState: data.fiscalState || null,
        fiscalMunicipality: data.fiscalMunicipality || null,
        fiscalCountry: data.fiscalCountry || null,
      },
    });
  }

  async update(customer: Customer): Promise<void> {
    const data = this.toPrismaUpdate(customer);

    await prisma.customer.update({
      where: {
        id: customer.getId(),
        companyId: customer.getCompanyId(),
      },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string, companyId: string): Promise<void> {
    await prisma.customer.deleteMany({
      where: {
        id,
        companyId,
      },
    });
  }

  async findById(id: string, companyId: string): Promise<Customer | null> {
    const prismaCustomer = await prisma.customer.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!prismaCustomer) return null;
    return this.toEntity(prismaCustomer as PrismaCustomer);
  }

  async existsById(id: string, companyId: string): Promise<boolean> {
    const count = await prisma.customer.count({
      where: {
        id,
        companyId,
      },
    });

    return count > 0;
  }

  async findByEmail(
    email: string,
    companyId: string
  ): Promise<Customer | null> {
    const prismaCustomer = await prisma.customer.findFirst({
      where: {
        email,
        companyId,
      },
    });

    if (!prismaCustomer) return null;
    return this.toEntity(prismaCustomer as PrismaCustomer);
  }

  async findByRFC(rfc: string, companyId: string): Promise<Customer | null> {
    const prismaCustomer = await prisma.customer.findFirst({
      where: {
        rfc,
        companyId,
      },
    });

    if (!prismaCustomer) return null;
    return this.toEntity(prismaCustomer as PrismaCustomer);
  }

  async emailExists(
    email: string,
    companyId: string,
    excludeCustomerId?: string
  ): Promise<boolean> {
    const where: Prisma.CustomerWhereInput = {
      email,
      companyId,
    };

    if (excludeCustomerId) {
      where.id = { not: excludeCustomerId };
    }

    const count = await prisma.customer.count({ where });
    return count > 0;
  }

  async rfcExists(
    rfc: string,
    companyId: string,
    excludeCustomerId?: string
  ): Promise<boolean> {
    const where: Prisma.CustomerWhereInput = {
      rfc,
      companyId,
    };

    if (excludeCustomerId) {
      where.id = { not: excludeCustomerId };
    }

    const count = await prisma.customer.count({ where });
    return count > 0;
  }

  async findAll(
    companyId: string,
    filters?: CustomerFilters
  ): Promise<PaginatedResult<Customer>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;
    const search = filters?.search;

    // Construir condiciones WHERE
    const where: Prisma.CustomerWhereInput = {
      companyId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { rfc: { contains: search, mode: "insensitive" } },
        { razonSocial: { contains: search, mode: "insensitive" } },
      ];
    }

    // Ejecutar queries en paralelo
    const [prismaCustomers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.customer.count({ where }),
    ]);

    // Convertir a Entities
    const customers = prismaCustomers.map((customer) =>
      this.toEntity(customer as PrismaCustomer)
    );

    return {
      data: customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findInvoiceable(companyId: string): Promise<Customer[]> {
    const prismaCustomers = await prisma.customer.findMany({
      where: {
        companyId,
        rfc: { not: null },
        usoCFDI: { not: null },
        taxRegime: { not: null },
        fiscalStreet: { not: null },
        fiscalExteriorNumber: { not: null },
        fiscalNeighborhood: { not: null },
        fiscalPostalCode: { not: null },
        fiscalCity: { not: null },
        fiscalState: { not: null },
        fiscalMunicipality: { not: null },
      },
    });

    return prismaCustomers.map((customer) =>
      this.toEntity(customer as PrismaCustomer)
    );
  }

  async countByCompany(companyId: string): Promise<number> {
    return prisma.customer.count({
      where: { companyId },
    });
  }

  async countInvoiceable(companyId: string): Promise<number> {
    return prisma.customer.count({
      where: {
        companyId,
        rfc: { not: null },
        usoCFDI: { not: null },
        taxRegime: { not: null },
        fiscalStreet: { not: null },
        fiscalExteriorNumber: { not: null },
        fiscalNeighborhood: { not: null },
        fiscalPostalCode: { not: null },
        fiscalCity: { not: null },
        fiscalState: { not: null },
        fiscalMunicipality: { not: null },
      },
    });
  }

  async canBeDeleted(id: string, companyId: string): Promise<boolean> {
    // Verificar si el cliente tiene ventas
    const salesCount = await prisma.sale.count({
      where: {
        customerId: id,
        companyId,
      },
    });

    return salesCount === 0;
  }
}
