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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const payload = jwt.verify(token, JWT_SECRET!) as JwtPayload;
    const { id } = await params;

    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        companyId: payload.companyId, // 🔒 CLAVE
      },
      include: {
        purchases: {
          orderBy: { date: "desc" },
          take: 10,
          include: {
            purchaseItems: {
              include: {
                product: {
                  select: { name: true, sku: true },
                },
              },
            },
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ supplier });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al obtener proveedor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const payload = jwt.verify(token, JWT_SECRET!) as JwtPayload;
    const { id } = await params;
    const body = await req.json();

    const result = await prisma.supplier.updateMany({
      where: {
        id,
        companyId: payload.companyId, // 🔒
      },
      data: {
        name: body.name,
        contactName: body.contactName,
        phone: body.phone,
        email: body.email,
        street: body.street,
        neighborhood: body.neighborhood,
        postalCode: body.postalCode,
        city: body.city,
        state: body.state,
        municipality: body.municipality,
        rfc: body.rfc,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Proveedor actualizado" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al actualizar proveedor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const payload = jwt.verify(token, JWT_SECRET!) as JwtPayload;
    const { id } = await params;

    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        companyId: payload.companyId, // 🔒
      },
      include: {
        purchases: { take: 1 },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 }
      );
    }

    if (supplier.purchases.length > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar el proveedor porque tiene compras asociadas",
        },
        { status: 400 }
      );
    }

    await prisma.supplier.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Proveedor eliminado correctamente",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al eliminar proveedor" },
      { status: 500 }
    );
  }
}
