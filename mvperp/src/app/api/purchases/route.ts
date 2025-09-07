// app/api/purchases/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// Interfaces para los tipos
interface PurchaseItemRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface PurchaseRequest {
  supplierId: string;
  items: PurchaseItemRequest[];
  notes?: string;
}

interface JwtPayload {
  userId: string;
  email: string;
  name?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación usando tu sistema JWT
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
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
      userId = payload.userId;
    } catch {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 401 }
      );
    }

    const { supplierId, items, notes }: PurchaseRequest = await req.json();

    // Validaciones básicas
    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Datos de compra inválidos" },
        { status: 400 }
      );
    }

    // Validar cada item
    for (const item of items) {
      if (!item.productId || item.quantity <= 0 || item.unitPrice <= 0) {
        return NextResponse.json(
          { error: "Datos de items inválidos" },
          { status: 400 }
        );
      }
    }

    // 1. Calcular el total de la compra
    const totalAmount = items.reduce(
      (sum: number, item: PurchaseItemRequest) => {
        return sum + item.quantity * item.unitPrice;
      },
      0
    );

    // 2. Crear la compra
    const purchase = await prisma.purchase.create({
      data: {
        supplierId,
        userId,
        totalAmount,
        notes,
        purchaseItems: {
          create: items.map((item: PurchaseItemRequest) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        purchaseItems: true,
      },
    });

    // 3. Crear movimientos y actualizar stock
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (product) {
        const previousStock = product.stock || 0;
        const newStock = previousStock + item.quantity;

        // Crear movimiento
        await prisma.movement.create({
          data: {
            productId: item.productId,
            userId: userId,
            type: "entrada",
            quantity: item.quantity,
            previousStock,
            newStock,
            note: `Compra #${purchase.id}`,
          },
        });

        // Actualizar producto - solo stock, mantener precio y costo existentes
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: newStock,
            // Opcional: actualizar el costo con el último precio de compra
            // cost: item.unitPrice,
          },
        });
      } else {
        console.warn(`Producto con ID ${item.productId} no encontrado`);
      }
    }

    // 4. Actualizar el proveedor
    await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        totalPurchases: { increment: totalAmount },
        lastPurchase: new Date(),
      },
    });

    return NextResponse.json({ purchase });
  } catch (error) {
    console.error("Error creating purchase:", error);
    return NextResponse.json(
      { error: "Error creating purchase" },
      { status: 500 }
    );
  }
}


export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación
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
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
      userId = payload.userId;
    } catch {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 401 }
      );
    }

    // Obtener compras con información relacionada
    const purchases = await prisma.purchase.findMany({
      include: {
        user: {
          select: {
            name: true,
          },
        },
        supplier: {
          select: {
            name: true,
          },
        },
        purchaseItems: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calcular deuda (si el estado es pendiente, la deuda es igual al total)
    const purchasesWithDebt = purchases.map((purchase) => ({
      ...purchase,
      debt: purchase.status === "pending" ? purchase.totalAmount : 0,
    }));

    return NextResponse.json({ purchases: purchasesWithDebt });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json(
      { error: "Error fetching purchases" },
      { status: 500 }
    );
  }
}