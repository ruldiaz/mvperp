// src/app/api/customers/v2/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GetCustomersUseCase } from "@/core/customer/application/use-cases/GetCustomersUseCase";
import { PrismaCustomerRepository } from "@/infrastructure/customer/persistence/PrismaCustomerRepository";
import { CustomerError } from "@/core/customer/domain/exceptions/CustomerError";
import jwt from "jsonwebtoken";
import { CreateCustomerUseCase } from "@/core/customer/application/use-cases/CreateCustomerUseCase";
import { CreateCustomerInput } from "@/core/customer/application/use-cases/CreateCustomerUseCase";

const JWT_SECRET = process.env.JWT_SECRET;

// Helper IDÉNTICO a tu verifyAuth actual
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

export async function GET(request: NextRequest) {
  try {
    // 1. Autenticación
    const auth = await verifyAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // 2. Extraer parámetros de query
    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get("search") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
    };

    // 3. Inicializar dependencias
    const repository = new PrismaCustomerRepository();
    const useCase = new GetCustomersUseCase(repository);

    // 4. Ejecutar caso de uso
    const result = await useCase.execute({
      companyId: auth.user.companyId,
      filters,
    });

    // 5. Retornar respuesta
    return NextResponse.json({
      customers: result.customers,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error en API v2 /customers:", error);

    if (error instanceof CustomerError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();

    // Validar que el body tenga los campos mínimos requeridos
    if (!body.name || !body.razonSocial) {
      return NextResponse.json(
        { error: "Nombre y razón social son requeridos" },
        { status: 400 }
      );
    }

    const repository = new PrismaCustomerRepository();
    const useCase = new CreateCustomerUseCase(repository);

    // Crear input tipado correctamente
    const input: CreateCustomerInput = {
      companyId: auth.user.companyId,
      name: body.name,
      razonSocial: body.razonSocial,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      rfc: body.rfc || null,
      usoCFDI: body.usoCFDI || null,
      taxRegime: body.taxRegime || null,
      fiscalAddress: body.fiscalAddress || null,
      fiscalStreet: body.fiscalStreet || null,
      fiscalExteriorNumber: body.fiscalExteriorNumber || null,
      fiscalInteriorNumber: body.fiscalInteriorNumber || null,
      fiscalNeighborhood: body.fiscalNeighborhood || null,
      fiscalPostalCode: body.fiscalPostalCode || null,
      fiscalCity: body.fiscalCity || null,
      fiscalState: body.fiscalState || null,
      fiscalMunicipality: body.fiscalMunicipality || null,
      fiscalCountry: body.fiscalCountry || null,
    };

    const result = await useCase.execute(input);

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("Error en POST /api/customers/v2:", error);

    if (error instanceof CustomerError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Manejar error desconocido de forma segura
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
