// src/core/customer/application/ports/ICustomerRepository.ts
import { Customer } from "../../domain/Customer";

/**
 * Filtros para búsqueda de clientes
 */
export interface CustomerFilters {
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Resultado paginado para consultas
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Interfaz del repositorio de Customer
 * Define los contratos que debe cumplir cualquier implementación
 */
export interface ICustomerRepository {
  // ============ OPERACIONES CRUD ============

  /**
   * Guardar un nuevo cliente
   */
  save(customer: Customer): Promise<void>;

  /**
   * Actualizar un cliente existente
   */
  update(customer: Customer): Promise<void>;

  /**
   * Eliminar un cliente por ID
   */
  delete(id: string, companyId: string): Promise<void>;

  // ============ CONSULTAS POR ID ============

  /**
   * Buscar cliente por ID
   */
  findById(id: string, companyId: string): Promise<Customer | null>;

  /**
   * Verificar si existe un cliente por ID
   */
  existsById(id: string, companyId: string): Promise<boolean>;

  // ============ CONSULTAS POR ATRIBUTOS ============

  /**
   * Buscar cliente por email (único por compañía)
   */
  findByEmail(email: string, companyId: string): Promise<Customer | null>;

  /**
   * Buscar cliente por RFC (único por compañía)
   */
  findByRFC(rfc: string, companyId: string): Promise<Customer | null>;

  /**
   * Verificar si un email ya existe en la compañía
   */
  emailExists(
    email: string,
    companyId: string,
    excludeCustomerId?: string
  ): Promise<boolean>;

  /**
   * Verificar si un RFC ya existe en la compañía
   */
  rfcExists(
    rfc: string,
    companyId: string,
    excludeCustomerId?: string
  ): Promise<boolean>;

  // ============ CONSULTAS MÚLTIPLES ============

  /**
   * Obtener todos los clientes de una compañía (paginado)
   */
  findAll(
    companyId: string,
    filters?: CustomerFilters
  ): Promise<PaginatedResult<Customer>>;

  /**
   * Obtener clientes que pueden recibir facturas
   */
  findInvoiceable(companyId: string): Promise<Customer[]>;

  /**
   * Contar total de clientes por compañía
   */
  countByCompany(companyId: string): Promise<number>;

  /**
   * Contar clientes que pueden recibir facturas
   */
  countInvoiceable(companyId: string): Promise<number>;

  // ============ OPERACIONES DE NEGOCIO ============

  /**
   * Verificar si un cliente puede ser eliminado (no tiene ventas)
   * Esto podría moverse a un Specification
   */
  canBeDeleted(id: string, companyId: string): Promise<boolean>;
}
