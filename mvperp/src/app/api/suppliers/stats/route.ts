// src/app/api/suppliers/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtPayload {
  userId: string;
  email: string;
  name?: string;
}

// GET /api/suppliers/stats - Obtener estadísticas de proveedores
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

    // Obtener estadísticas
    const totalSuppliers = await prisma.supplier.count();
    const totalPurchases = await prisma.purchase.aggregate({
      _sum: {
        totalAmount: true,
      },
    });

    // Obtener top 5 proveedores por volumen de compras
    const topSuppliers = await prisma.supplier.findMany({
      orderBy: {
        totalPurchases: "desc",
      },
      take: 5,
    });

    return NextResponse.json({
      totalSuppliers,
      totalPurchases: totalPurchases._sum.totalAmount || 0,
      topSuppliers,
    });
  } catch (error) {
    console.error("Error fetching supplier stats:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas de proveedores" },
      { status: 500 }
    );
  }
}
