// src/core/customer/application/use-cases/DeleteCustomerUseCase.ts
import { ICustomerRepository } from "../ports/ICustomerRepository";
import { CustomerError } from "../../domain/exceptions/CustomerError";

export interface DeleteCustomerInput {
  id: string;
  companyId: string;
}

export interface DeleteCustomerOutput {
  success: boolean;
  message: string;
}

export class DeleteCustomerUseCase {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  async execute(input: DeleteCustomerInput): Promise<DeleteCustomerOutput> {
    try {
      // 1. Verificar que el cliente existe
      const exists = await this.customerRepository.existsById(
        input.id,
        input.companyId
      );

      if (!exists) {
        throw new CustomerError("Cliente no encontrado");
      }

      // 2. Verificar que se puede eliminar (no tiene ventas)
      const canBeDeleted = await this.customerRepository.canBeDeleted(
        input.id,
        input.companyId
      );

      if (!canBeDeleted) {
        throw new CustomerError(
          "No se puede eliminar un cliente con ventas registradas"
        );
      }

      // 3. Eliminar cliente
      await this.customerRepository.delete(input.id, input.companyId);

      return {
        success: true,
        message: "Cliente eliminado exitosamente",
      };
    } catch (error) {
      if (error instanceof CustomerError) {
        throw error;
      }
      console.error("Error en DeleteCustomerUseCase:", error);
      throw new CustomerError("Error al eliminar el cliente");
    }
  }
}
