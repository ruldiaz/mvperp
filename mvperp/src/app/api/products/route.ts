// src/app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET;

// Interfaces para los tipos de datos
interface VariantData {
  type: string;
  value: string;
}

interface PriceListData {
  name: string;
  price: number;
}

interface ProductRequestBody {
  name: string;
  type?: string;
  barcode?: string;
  category?: string;
  sku?: string;
  sellAtPOS?: boolean;
  includeInCatalog?: boolean;
  requirePrescription?: boolean;
  saleUnit?: string;
  brand?: string;
  description?: string;
  useStock?: boolean;
  quantity?: number;
  price?: number;
  cost?: number;
  stock?: number;
  image?: string;
  location?: string;
  minimumQuantity?: number;
  satKey?: string;
  iva?: number;
  ieps?: number;
  satUnitKey?: string;
  ivaIncluded?: boolean;
  variants?: VariantData[];
  priceLists?: PriceListData[];
}

export async function GET(req: NextRequest) {
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
      include: {
        variants: true,
        priceLists: true,
      },
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
    const body: ProductRequestBody = await req.json();

    // Crear el producto
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
        image: body.image,
        location: body.location,
        minimumQuantity: body.minimumQuantity,
        satKey: body.satKey,
        iva: body.iva,
        ieps: body.ieps,
        satUnitKey: body.satUnitKey,
        ivaIncluded: body.ivaIncluded ?? true,
      },
    });

    // Crear variantes si existen
    if (body.variants && body.variants.length > 0) {
      await prisma.variant.createMany({
        data: body.variants.map((variant) => ({
          productId: product.id,
          type: variant.type,
          value: variant.value,
        })),
      });
    }

    // Crear listas de precios si existen
    if (body.priceLists && body.priceLists.length > 0) {
      await prisma.priceList.createMany({
        data: body.priceLists.map((priceList) => ({
          productId: product.id,
          name: priceList.name,
          price: priceList.price,
        })),
      });
    }

    // Obtener el producto completo con relaciones
    const productWithRelations = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        variants: true,
        priceLists: true,
      },
    });

    return NextResponse.json({ product: productWithRelations });
  } catch (err: unknown) {
    console.error(err);

    let message = "Error al crear el producto";

    if (err instanceof Error) {
      message = err.message;
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}