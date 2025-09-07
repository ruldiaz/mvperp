// app/api/purchases/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtPayload {
  userId: string;
  email: string;
  name?: string;
}

interface Params {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: Params) {
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

    const { id } = params;

    // Obtener compra con información relacionada
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        supplier: {
          select: {
            name: true,
            contactName: true,
            phone: true,
            email: true,
          },
        },
        purchaseItems: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Compra no encontrada" },
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
