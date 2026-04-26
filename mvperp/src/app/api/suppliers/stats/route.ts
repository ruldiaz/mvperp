import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtPayload {
  userId: string;
  email: string;
  name?: string;
  companyId: string;
}

// GET /api/suppliers/stats
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

    // ✅ Validar token y extraer payload
    let companyId: string;
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
      companyId = payload.companyId;

      if (!companyId) {
        return NextResponse.json(
          { error: "Usuario sin empresa asociada" },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 401 }
      );
    }

    const totalSuppliers = await prisma.supplier.count({
      where: { companyId },
    });

    const totalPurchases = await prisma.purchase.aggregate({
      where: { companyId },
      _sum: {
        totalAmount: true,
      },
    });

    const topSuppliers = await prisma.supplier.findMany({
      where: { companyId },
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
