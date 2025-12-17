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

/* =========================
   GET /api/products/[id]
========================= */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    const product = await prisma.product.findFirst({
      where: {
        id: params.id,
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
  } catch (error) {
    console.error(error);
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
  { params }: { params: { id: string } }
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

    const existingProduct = await prisma.product.findFirst({
      where: {
        id: params.id,
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
    const body = JSON.parse(formData.get("product") as string);

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
      quantity: body.quantity,
      price: body.price,
      cost: body.cost,
      stock: body.stock,
      location: body.location,
      minimumQuantity: body.minimumQuantity,
      satKey: body.satKey,
      iva: body.iva,
      ieps: body.ieps,
      satUnitKey: body.satUnitKey,
      ivaIncluded: body.ivaIncluded,
      image: imageUrl,
    };

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: Object.fromEntries(
        Object.entries(safeData).filter(([, v]) => v !== undefined)
      ),
    });

    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    console.error(error);
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
  { params }: { params: { id: string } }
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

    const product = await prisma.product.findFirst({
      where: {
        id: params.id,
        companyId: payload.companyId,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Producto eliminado" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al borrar producto" },
      { status: 500 }
    );
  }
}
