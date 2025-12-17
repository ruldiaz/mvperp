import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UpdateQuotationRequest } from "@/types/sale";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtPayload {
  userId: string;
  companyId: string;
  email: string;
  name?: string;
}

async function verifyAuth(request: NextRequest) {
  if (!JWT_SECRET) {
    return { error: "JWT secret no definido", status: 500 };
  }

  const token = request.cookies.get("token")?.value;
  if (!token) {
    return { error: "No autenticado", status: 401 };
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!payload.companyId) {
      return { error: "No se pudo identificar la empresa", status: 400 };
    }
    return { user: payload };
  } catch {
    return { error: "Token inválido o expirado", status: 401 };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await verifyAuth(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { user } = authResult;

    // Usar findFirst para poder filtrar por companyId
    const quotation = await prisma.quotation.findFirst({
      where: {
        id,
        companyId: user.companyId, // ← FILTRADO POR EMPRESA
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            rfc: true,
            razonSocial: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        quotationItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                description: true,
                satKey: true,
                satUnitKey: true,
                price: true,
                cost: true,
              },
            },
          },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { error: "Cotización no encontrada o no tienes acceso" },
        { status: 404 }
      );
    }

    return NextResponse.json({ quotation });
  } catch (error) {
    console.error("Error fetching quotation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await verifyAuth(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { user } = authResult;

    // Verificar que la cotización existe y pertenece a la empresa
    const existingQuotation = await prisma.quotation.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    });

    if (!existingQuotation) {
      return NextResponse.json(
        { error: "Cotización no encontrada o no tienes acceso" },
        { status: 404 }
      );
    }

    const body: UpdateQuotationRequest = await request.json();

    // Si se cambia el cliente, verificar que pertenece a la empresa
    if (body.customerId && body.customerId !== existingQuotation.customerId) {
      const customer = await prisma.customer.findFirst({
        where: {
          id: body.customerId,
          companyId: user.companyId,
        },
      });

      if (!customer) {
        return NextResponse.json(
          { error: "Cliente no encontrado o no pertenece a esta empresa" },
          { status: 404 }
        );
      }
    }

    // No permitir modificar cotizaciones convertidas a ventas
    if (existingQuotation.status === "converted") {
      return NextResponse.json(
        {
          error: "No se puede modificar una cotización ya convertida en venta",
        },
        { status: 400 }
      );
    }

    const quotation = await prisma.quotation.update({
      where: { id },
      data: {
        customerId: body.customerId,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        status: body.status,
        notes: body.notes,
      },
      include: {
        customer: true,
        quotationItems: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json({ quotation });
  } catch (error) {
    console.error("Error updating quotation:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await verifyAuth(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { user } = authResult;

    // Verificar que la cotización existe y pertenece a la empresa
    const existingQuotation = await prisma.quotation.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    });

    if (!existingQuotation) {
      return NextResponse.json(
        { error: "Cotización no encontrada o no tienes acceso" },
        { status: 404 }
      );
    }

    // No permitir eliminar cotizaciones convertidas a ventas
    if (existingQuotation.status === "converted") {
      return NextResponse.json(
        { error: "No se puede eliminar una cotización ya convertida en venta" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Eliminar items primero
      await tx.quotationItem.deleteMany({
        where: { quotationId: id },
      });

      // Eliminar cotización
      await tx.quotation.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      message: "Cotización eliminada exitosamente",
    });
  } catch (error: unknown) {
    console.error("Error deleting quotation:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
