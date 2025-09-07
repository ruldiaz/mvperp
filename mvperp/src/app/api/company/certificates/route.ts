// app/api/company/certificates/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req: NextRequest) {
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

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      name?: string;
    };

    const formData = await req.formData();
    const csdCert = formData.get("csdCert") as string;
    const csdKey = formData.get("csdKey") as string;
    const csdPassword = formData.get("csdPassword") as string;

    // Buscar usuario con compañía
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { company: true },
    });

    if (!user || !user.company) {
      return NextResponse.json(
        { error: "Primero debe configurar los datos de la compañía" },
        { status: 400 }
      );
    }

    // Actualizar solo los campos de certificados
    const company = await prisma.company.update({
      where: { id: user.company.id },
      data: {
        ...(csdCert && { csdCert }),
        ...(csdKey && { csdKey }),
        ...(csdPassword && { csdPassword }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ company });
  } catch (error) {
    console.error("Error al subir certificados:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al subir certificados" },
      { status: 500 }
    );
  }
}
