// src/app/api/purchases/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtPayload {
  userId: string;
  companyId: string;
  email: string;
  name?: string;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json(
        { error: "JWT secret no definido" },
        { status: 500 }
      );
    }

    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    let companyId: string;

    try {
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
      companyId = payload.companyId;

      if (!companyId) {
        return NextResponse.json(
          { error: "No se pudo identificar la empresa" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const purchase = await prisma.purchase.findFirst({
      where: {
        id,
        companyId: companyId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        supplier: {
          select: {
            name: true,
            contactName: true,
            phone: true,
            email: true,
            rfc: true,
            address: true,
          },
        },
        purchaseItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                barcode: true,
                category: true,
                price: true,
                cost: true,
                stock: true,
              },
            },
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Compra no encontrada o no tienes acceso" },
        { status: 404 }
      );
    }

    return NextResponse.json({ purchase });
  } catch (error) {
    console.error("Error fetching purchase:", error);
    return NextResponse.json(
      { error: "Error fetching purchase" },
      { status: 500 }
    );
  }
}

// Método PUT para actualizar una compra
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json(
        { error: "JWT secret no definido" },
        { status: 500 }
      );
    }

    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    let companyId: string;

    try {
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
      // userId no se usa en este método, así que no lo extraemos
      companyId = payload.companyId;

      if (!companyId) {
        return NextResponse.json(
          { error: "No se pudo identificar la empresa" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();

    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        id,
        companyId: companyId,
      },
      include: {
        purchaseItems: true,
      },
    });

    if (!existingPurchase) {
      return NextResponse.json(
        { error: "Compra no encontrada o no tienes acceso" },
        { status: 404 }
      );
    }

    const updatedPurchase = await prisma.purchase.update({
      where: {
        id,
      },
      data: {
        status: body.status,
        notes: body.notes,
      },
      include: {
        purchaseItems: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json({ purchase: updatedPurchase });
  } catch (error) {
    console.error("Error updating purchase:", error);
    return NextResponse.json(
      { error: "Error updating purchase" },
      { status: 500 }
    );
  }
}

// Método DELETE para eliminar una compra
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json(
        { error: "JWT secret no definido" },
        { status: 500 }
      );
    }

    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    let userId: string;
    let companyId: string;

    try {
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
      userId = payload.userId;
      companyId = payload.companyId;

      if (!companyId) {
        return NextResponse.json(
          { error: "No se pudo identificar la empresa" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        id,
        companyId: companyId,
      },
      include: {
        purchaseItems: true,
      },
    });

    if (!existingPurchase) {
      return NextResponse.json(
        { error: "Compra no encontrada o no tienes acceso" },
        { status: 404 }
      );
    }

    if (existingPurchase.status === "completed") {
      for (const item of existingPurchase.purchaseItems) {
        const product = await prisma.product.findFirst({
          where: {
            id: item.productId,
            companyId: companyId,
          },
        });

        if (product) {
          const newStock = (product.stock || 0) - item.quantity;

          await prisma.movement.create({
            data: {
              productId: item.productId,
              userId: userId,
              type: "salida",
              quantity: item.quantity,
              previousStock: product.stock || 0,
              newStock: newStock,
              note: `Reversión de compra #${id}`,
            },
          });

          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: newStock,
            },
          });
        }
      }
    }

    await prisma.purchaseItem.deleteMany({
      where: {
        purchaseId: id,
      },
    });

    await prisma.purchase.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Compra eliminada correctamente",
    });
  } catch (error) {
    console.error("Error deleting purchase:", error);
    return NextResponse.json(
      { error: "Error deleting purchase" },
      { status: 500 }
    );
  }
}
