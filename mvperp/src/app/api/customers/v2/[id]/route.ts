// src/app/api/customers/v2/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GetCustomerUseCase } from "@/core/customer/application/use-cases/GetCustomerUseCase";
import { UpdateCustomerUseCase } from "@/core/customer/application/use-cases/UpdateCustomerUseCase";
import { DeleteCustomerUseCase } from "@/core/customer/application/use-cases/DeleteCustomerUseCase";
import { PrismaCustomerRepository } from "@/infrastructure/customer/persistence/PrismaCustomerRepository";
import { CustomerError } from "@/core/customer/domain/exceptions/CustomerError";
import jwt from "jsonwebtoken";
// AGREGAR ESTE IMPORT:
//import { prisma } from "@/lib/prisma"; // O usa: import { prisma } from "@/infrastructure/customer/persistence/PrismaClient";
import { prisma } from "@/infrastructure/customer/persistence/PrismaClient";
const JWT_SECRET = process.env.JWT_SECRET;

async function verifyAuth(request: NextRequest) {
  if (!JWT_SECRET) {
    return { error: "JWT secret no definido", status: 500 };
  }

  const token = request.cookies.get("token")?.value;
  if (!token) {
    return { error: "No autenticado", status: 401 };
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      companyId: string;
    };

    return { user: payload };
  } catch {
    return { error: "Token inválido o expirado", status: 401 };
  }
}

// GET /api/customers/v2/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const repository = new PrismaCustomerRepository();
    const useCase = new GetCustomerUseCase(repository);

    // 1. Obtener cliente usando Clean Architecture
    const customer = await useCase.execute({
      id,
      companyId: auth.user.companyId,
    });

    // 2. Obtener ventas SEPARADAMENTE para mantener compatibilidad
    const sales = await prisma.sale.findMany({
      where: {
        customerId: id,
        companyId: auth.user.companyId,
      },
      orderBy: { createdAt: "desc" },
      include: {
        saleItems: {
          include: {
            product: {
              select: { name: true, sku: true },
            },
          },
        },
      },
    });

    // 3. Retornar MISMA ESTRUCTURA que el endpoint legacy
    return NextResponse.json({
      customer: {
        // Todos los campos del cliente de Clean Architecture
        ...customer,

        // CAMPOS ADICIONALES para compatibilidad con el frontend:
        sales, // ← ¡ESTO ES LO QUE FALTA!

        // Si el frontend también usa _count (verifica en tu código)
        _count: {
          sales: sales.length,
        },

        // Otros campos que podrían faltar:
        address: customer.address || null,
        fiscalStreet: customer.fiscalAddress
          ? extractStreetFromAddress(customer.fiscalAddress)
          : null,
        fiscalExteriorNumber: null, // Necesitarías extraerlo de la dirección
        fiscalInteriorNumber: null,
        fiscalNeighborhood: null,
        fiscalPostalCode: null,
        fiscalCity: null,
        fiscalState: null,
        fiscalMunicipality: null,
        fiscalCountry: null,
      },
    });
  } catch (error: unknown) {
    console.error("Error en GET /api/customers/v2/[id]:", error);

    if (error instanceof CustomerError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Función helper para extraer calle de dirección (si es necesario)
function extractStreetFromAddress(address: string | null): string | null {
  if (!address) return null;
  // Lógica simple para extraer la calle
  return address.split(",")[0]?.trim() || null;
}

// PUT /api/customers/v2/[id] (se mantiene igual)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await request.json();

    const repository = new PrismaCustomerRepository();
    const useCase = new UpdateCustomerUseCase(repository);

    const result = await useCase.execute({
      id,
      companyId: auth.user.companyId,
      ...body,
    });

    return NextResponse.json({ customer: result });
  } catch (error: unknown) {
    console.error("Error en PUT /api/customers/v2/[id]:", error);

    if (error instanceof CustomerError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/customers/v2/[id] (se mantiene igual)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const repository = new PrismaCustomerRepository();
    const useCase = new DeleteCustomerUseCase(repository);

    const result = await useCase.execute({
      id,
      companyId: auth.user.companyId,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error en DELETE /api/customers/v2/[id]:", error);

    if (error instanceof CustomerError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
