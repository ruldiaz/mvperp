// src/app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });
    if (!product)
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    return NextResponse.json({ product });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Error al obtener producto" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json();

    // Filtramos undefined para no romper Prisma
    const safeData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: safeData,
    });

    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Error al actualizar producto" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await prisma.product.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: "Producto borrado", product: deleted });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Error al borrar producto" },
      { status: 500 }
    );
  }
}
