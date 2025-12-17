// src/app/api/sales/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UpdateSaleRequest } from "@/types/sale";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtPayload {
  userId: string;
  companyId: string;
  email: string;
  name?: string;
}

// Función auxiliar para verificar el token
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
    const sale = await prisma.sale.findFirst({
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
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        saleItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                barcode: true,
                useStock: true,
                stock: true,
                price: true,
                cost: true,
              },
            },
          },
        },
        invoices: {
          select: {
            id: true,
            status: true,
            serie: true,
            folio: true,
            uuid: true,
            pdfUrl: true,
            xmlUrl: true,
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Venta no encontrada o no tienes acceso" },
        { status: 404 }
      );
    }

    return NextResponse.json({ sale });
  } catch (error) {
    console.error("Error fetching sale:", error);
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

    // Verificar que la venta existe y pertenece a la empresa
    const existingSale = await prisma.sale.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    });

    if (!existingSale) {
      return NextResponse.json(
        { error: "Venta no encontrada o no tienes acceso" },
        { status: 404 }
      );
    }

    // Verificar que no haya facturas asociadas (no se puede modificar una venta facturada)
    const invoices = await prisma.invoice.findMany({
      where: {
        saleId: id,
        companyId: user.companyId,
      },
    });

    if (invoices.length > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede modificar una venta que ya tiene facturas asociadas",
        },
        { status: 400 }
      );
    }

    const body: UpdateSaleRequest = await request.json();

    // Si se cambia el cliente, verificar que pertenece a la empresa
    if (body.customerId && body.customerId !== existingSale.customerId) {
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

    const sale = await prisma.sale.update({
      where: { id },
      data: {
        customerId: body.customerId,
        notes: body.notes,
        status: body.status,
      },
      include: {
        customer: true,
        saleItems: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json({ sale });
  } catch (error) {
    console.error("Error updating sale:", error);

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

    // Verificar que el usuario existe y pertenece a la empresa
    const userRecord = await prisma.user.findFirst({
      where: {
        id: user.userId,
        companyId: user.companyId,
      },
    });

    if (!userRecord) {
      return NextResponse.json(
        { error: "Usuario no encontrado o no pertenece a esta empresa" },
        { status: 404 }
      );
    }

    // Verificar que no haya facturas asociadas
    const invoices = await prisma.invoice.findMany({
      where: {
        saleId: id,
        companyId: user.companyId,
      },
    });

    if (invoices.length > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar una venta que ya tiene facturas asociadas",
        },
        { status: 400 }
      );
    }

    // Use transaction to handle sale deletion and stock restoration
    await prisma.$transaction(async (tx) => {
      // Get sale with items for stock restoration
      const sale = await tx.sale.findFirst({
        where: {
          id,
          companyId: user.companyId,
        },
        include: {
          saleItems: {
            include: {
              product: {
                select: {
                  id: true,
                  useStock: true,
                  stock: true,
                  name: true,
                  companyId: true,
                },
              },
            },
          },
        },
      });

      if (!sale) {
        throw new Error("Venta no encontrada o no tienes acceso");
      }

      // Restore product stock for each sale item
      for (const item of sale.saleItems) {
        // Verificar que el producto pertenece a la empresa
        if (item.product.companyId !== user.companyId) {
          throw new Error(
            `Producto ${item.product.name} no pertenece a esta empresa`
          );
        }

        if (item.product.useStock) {
          const currentStock = item.product.stock || 0;
          const newStock = currentStock + item.quantity;

          await tx.product.update({
            where: {
              id: item.productId,
              companyId: user.companyId,
            },
            data: {
              stock: newStock,
            },
          });

          // Create stock movement for restoration
          await tx.movement.create({
            data: {
              productId: item.productId,
              userId: user.userId,
              type: "entrada",
              quantity: item.quantity,
              previousStock: currentStock,
              newStock: newStock,
              note: `Cancelación de venta #${sale.id.slice(0, 8)}`,
            },
          });
        }
      }

      // Delete sale items
      await tx.saleItem.deleteMany({
        where: { saleId: id },
      });

      // Delete sale
      await tx.sale.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      message: "Venta eliminada exitosamente",
    });
  } catch (error: unknown) {
    console.error("Error deleting sale:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
