import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtPayload {
  userId: string;
  companyId: string;
}

interface ProductData {
  name?: string;
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
  quantity?: string | number;
  price?: string | number;
  cost?: string | number;
  stock?: string | number;
  location?: string;
  minimumQuantity?: string | number;
  satKey?: string;
  iva?: string | number;
  ieps?: string | number;
  satUnitKey?: string;
  ivaIncluded?: boolean;
  image?: string;
}

interface PrismaError extends Error {
  code?: string;
  meta?: {
    target?: string[];
  };
}

function isPrismaError(error: unknown): error is PrismaError {
  return error instanceof Error && "code" in error && "meta" in error;
}

function parseNumber(value: string | number | undefined): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? undefined : num;
}

/* =========================
   GET /api/products/[id]
========================= */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: {
        id: id,
        companyId: payload.companyId,
      },
      include: {
        variants: true,
        priceLists: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error: unknown) {
    console.error("Error al obtener producto:", error);
    return NextResponse.json(
      { error: "Error al obtener producto" },
      { status: 500 }
    );
  }
}

/* =========================
   PUT /api/products/[id]
========================= */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const existingProduct = await prisma.product.findFirst({
      where: {
        id: id,
        companyId: payload.companyId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const productData = formData.get("product") as string | null;

    if (!productData) {
      return NextResponse.json(
        { error: "Datos del producto no proporcionados" },
        { status: 400 }
      );
    }

    const body: ProductData = JSON.parse(productData);

    let imageUrl = body.image ?? existingProduct.image;

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

    /* ===== Datos seguros (NO companyId / userId) ===== */
    const safeData = {
      name: body.name,
      type: body.type,
      barcode: body.barcode,
      category: body.category,
      sku: body.sku,
      sellAtPOS: body.sellAtPOS,
      includeInCatalog: body.includeInCatalog,
      requirePrescription: body.requirePrescription,
      saleUnit: body.saleUnit,
      brand: body.brand,
      description: body.description,
      useStock: body.useStock,
      quantity: parseNumber(body.quantity),
      price: parseNumber(body.price),
      cost: parseNumber(body.cost),
      stock: parseNumber(body.stock),
      location: body.location,
      minimumQuantity: parseNumber(body.minimumQuantity),
      satKey: body.satKey,
      iva: parseNumber(body.iva),
      ieps: parseNumber(body.ieps),
      satUnitKey: body.satUnitKey,
      ivaIncluded: body.ivaIncluded,
      image: imageUrl,
    };

    // Filtrar solo los campos que tienen valores definidos
    const updateData = Object.fromEntries(
      Object.entries(safeData).filter(([, v]) => v !== undefined)
    );

    const updatedProduct = await prisma.product.update({
      where: { id: id },
      data: updateData,
    });

    return NextResponse.json({
      product: updatedProduct,
      message: "Producto actualizado correctamente",
    });
  } catch (error: unknown) {
    console.error("Error al actualizar producto:", error);

    if (error instanceof Error) {
      // Manejo específico de errores de JSON
      if (error.name === "SyntaxError") {
        return NextResponse.json(
          { error: "Formato JSON inválido en los datos del producto" },
          { status: 400 }
        );
      }
    }

    // Manejo de errores de Prisma
    if (isPrismaError(error)) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "El producto no existe o no se pudo actualizar" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: "Error al actualizar producto" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE /api/products/[id]
========================= */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: {
        id: id,
        companyId: payload.companyId,
      },
      include: {
        variants: {
          select: { id: true },
        },
        priceLists: {
          select: { id: true },
        },
        purchaseItems: {
          select: { id: true },
        },
        saleItems: {
          select: { id: true },
        },
        quotationItems: {
          select: { id: true },
        },
        movements: {
          select: { id: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si el producto tiene relaciones que podrían impedir la eliminación
    const hasRelations =
      product.purchaseItems.length > 0 ||
      product.saleItems.length > 0 ||
      product.quotationItems.length > 0;

    if (hasRelations) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar el producto porque tiene registros relacionados (compras, ventas o cotizaciones)",
          details: {
            purchaseItems: product.purchaseItems.length,
            saleItems: product.saleItems.length,
            quotationItems: product.quotationItems.length,
          },
        },
        { status: 400 }
      );
    }

    // Eliminar variantes, listas de precios y movimientos relacionados primero
    await prisma.$transaction(async (tx) => {
      // Eliminar variantes
      if (product.variants.length > 0) {
        await tx.variant.deleteMany({
          where: { productId: id },
        });
      }

      // Eliminar listas de precios
      if (product.priceLists.length > 0) {
        await tx.priceList.deleteMany({
          where: { productId: id },
        });
      }

      // Eliminar movimientos
      if (product.movements.length > 0) {
        await tx.movement.deleteMany({
          where: { productId: id },
        });
      }

      // Finalmente eliminar el producto
      await tx.product.delete({
        where: { id: id },
      });
    });

    return NextResponse.json({
      message: "Producto eliminado correctamente",
      deletedProduct: {
        id: product.id,
        name: product.name,
        sku: product.sku,
      },
    });
  } catch (error: unknown) {
    console.error("Error al borrar producto:", error);

    // Manejo de errores de Prisma
    if (isPrismaError(error)) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "El producto no existe" },
          { status: 404 }
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          {
            error:
              "No se puede eliminar el producto porque tiene registros relacionados que no se pudieron eliminar",
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Error al borrar producto" },
      { status: 500 }
    );
  }
}
