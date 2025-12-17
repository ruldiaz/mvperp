import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET;

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

interface JwtPayload {
  userId: string;
  companyId: string;
}

/* =========================
   GET /api/products
========================= */
export async function GET(req: NextRequest) {
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
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!payload.companyId) {
      return NextResponse.json(
        { error: "Usuario sin empresa asociada" },
        { status: 403 }
      );
    }

    const products = await prisma.product.findMany({
      where: {
        companyId: payload.companyId,
      },
      orderBy: {
        createdAt: "desc",
      },
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

/* =========================
   POST /api/products
========================= */
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
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!payload.companyId) {
      return NextResponse.json(
        { error: "Usuario sin empresa asociada" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const bodyRaw = formData.get("product") as string;
    const body: ProductRequestBody = JSON.parse(bodyRaw);

    let imageUrl = body.image ?? undefined;

    /* ===== Imagen ===== */
    const imageFile = formData.get("image") as File | null;
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

      const filename = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}.${ext}`;

      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);

      imageUrl = `/uploads/${filename}`;
    }

    /* ===== Crear producto ===== */
    const product = await prisma.product.create({
      data: {
        companyId: payload.companyId,
        userId: payload.userId,

        name: body.name,
        type: body.type ?? "producto",
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
        quantity: body.quantity,
        price: body.price,
        cost: body.cost,
        stock: body.stock ?? body.quantity,
        image: imageUrl,
        location: body.location,
        minimumQuantity: body.minimumQuantity,
        satKey: body.satKey,
        iva: body.iva,
        ieps: body.ieps,
        satUnitKey: body.satUnitKey,
        ivaIncluded: body.ivaIncluded ?? true,
      },
    });

    /* ===== Variantes ===== */
    if (body.variants?.length) {
      await prisma.variant.createMany({
        data: body.variants.map((v) => ({
          productId: product.id,
          type: v.type,
          value: v.value,
        })),
      });
    }

    /* ===== Listas de precio ===== */
    if (body.priceLists?.length) {
      await prisma.priceList.createMany({
        data: body.priceLists.map((p) => ({
          productId: product.id,
          name: p.name,
          price: p.price,
        })),
      });
    }

    const productWithRelations = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        variants: true,
        priceLists: true,
      },
    });

    return NextResponse.json({ product: productWithRelations });
  } catch (err) {
    console.error("POST /api/products error:", err);
    return NextResponse.json(
      { error: "Error al crear el producto" },
      { status: 500 }
    );
  }
}
