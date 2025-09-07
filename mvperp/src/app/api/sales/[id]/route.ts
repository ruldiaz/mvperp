// src/app/api/sales/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UpdateSaleRequest } from "@/types/sale";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

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
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      name?: string;
    };
    return { user: payload };
  } catch {
    return { error: "Token inválido o expirado", status: 401 };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ← Cambiado a Promise
) {
  try {
    // Await de los params
    const { id } = await params; // ← Await aquí

    const authResult = await verifyAuth(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const sale = await prisma.sale.findUnique({
      where: { id }, // ← Usar la variable desestructurada
      include: {
        customer: true,
        user: {
          select: {
            name: true,
          },
        },
        saleItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                useStock: true,
              },
            },
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
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
  { params }: { params: Promise<{ id: string }> } // ← Cambiado a Promise
) {
  try {
    // Await de los params
    const { id } = await params; // ← Await aquí

    const authResult = await verifyAuth(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body: UpdateSaleRequest = await request.json();

    const sale = await prisma.sale.update({
      where: { id }, // ← Usar la variable desestructurada
      data: {
        customerId: body.customerId,
        notes: body.notes,
        status: body.status,
      },
    });

    return NextResponse.json({ sale });
  } catch (error) {
    console.error("Error updating sale:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ← Cambiado a Promise
) {
  try {
    // Await de los params
    const { id } = await params; // ← Await aquí

    const authResult = await verifyAuth(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Get user ID from the JWT token
    const user = await prisma.user.findUnique({
      where: { id: authResult.user.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use transaction to handle sale deletion and stock restoration
    await prisma.$transaction(async (tx) => {
      // Get sale with items for stock restoration
      const sale = await tx.sale.findUnique({
        where: { id }, // ← Usar la variable desestructurada
        include: {
          saleItems: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!sale) {
        throw new Error("Sale not found");
      }

      // Restore product stock for each sale item
      for (const item of sale.saleItems) {
        if (item.product.useStock) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });

          // Create stock movement for restoration
          await tx.movement.create({
            data: {
              productId: item.productId,
              userId: user.id,
              type: "entrada",
              quantity: item.quantity,
              previousStock: item.product.stock || 0,
              newStock: (item.product.stock || 0) + item.quantity,
              note: `Cancelación de venta #${sale.id.slice(0, 8)}`,
            },
          });
        }
      }

      // Delete sale items
      await tx.saleItem.deleteMany({
        where: { saleId: id }, // ← Usar la variable desestructurada
      });

      // Delete sale
      await tx.sale.delete({
        where: { id }, // ← Usar la variable desestructurada
      });
    });

    return NextResponse.json({ message: "Sale deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting sale:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
