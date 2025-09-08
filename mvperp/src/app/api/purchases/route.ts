// app/api/purchases/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { PurchaseItemRequest, PurchaseRequest } from "@/types/purchase";

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtPayload {
  userId: string;
  email: string;
  name?: string;
}

export async function POST(req: NextRequest) {
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

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Datos de compra inválidos" },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item.productId || item.quantity <= 0 || item.unitPrice <= 0) {
        return NextResponse.json(
          { error: "Datos de items inválidos" },
          { status: 400 }
        );
      }
    }

    const totalAmount = items.reduce(
      (sum: number, item: PurchaseItemRequest) => {
        return sum + item.quantity * item.unitPrice;
      },
      0
    );

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

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (product) {
        const previousStock = product.stock || 0;
        const newStock = previousStock + item.quantity;

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

        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: newStock,
          },
        });
      }
    }

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

    const purchases = await prisma.purchase.findMany({
      where: { userId },
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
