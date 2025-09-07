// src/app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(req: NextRequest) {
  // Obtener usuario del token
  if (!JWT_SECRET)
    return NextResponse.json(
      { error: "JWT secret no definido" },
      { status: 500 }
    );

  const token = req.cookies.get("token")?.value;
  if (!token)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const products = await prisma.product.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  if (!JWT_SECRET)
    return NextResponse.json(
      { error: "JWT secret no definido" },
      { status: 500 }
    );

  const token = req.cookies.get("token")?.value;
  if (!token)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const body = await req.json();

    const product = await prisma.product.create({
      data: {
        userId: payload.userId,
        name: body.name,
        type: body.type || "producto",
        barcode: body.barcode,
        category: body.category,
        sku: body.sku,
        sellAtPOS: body.sellAtPOS ?? false,
        includeInCatalog: body.includeInCatalog ?? false,
        requirePrescription: body.requirePrescription ?? false,
        saleUnit: body.saleUnit,
        brand: body.brand,
        description: body.description,
        useStock: body.useStock ?? true,
        quantity: body.quantity ?? 0,
        price: body.price ?? 0,
        cost: body.cost ?? 0,
        stock: body.quantity ?? 0,
        location: body.location,
        minimumQuantity: body.minimumQuantity,
        satKey: body.satKey,
        iva: body.iva,
        ieps: body.ieps,
        image: body.image,
      },
    });

    return NextResponse.json({ product });
  } catch (err: unknown) {
    console.error(err);

    let message = "Error al crear el producto";

    if (err instanceof Error) {
      message = err.message;
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
