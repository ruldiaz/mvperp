// src/app/api/sales/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateSaleRequest } from "@/types/sale";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// Función auxiliar para verificar el token
async function verifyAuth(request: NextRequest) {
  if (!JWT_SECRET) {
    return { error: "JWT secret no definido", status: 500 };
  }

  const token = request.cookies.get("token")?.value;
  if (!token) {
    return { error: "No autenticado", status: 401 };
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      name?: string;
    };
    return { user: payload };
  } catch {
    return { error: "Token inválido o expirado", status: 401 };
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // Solución práctica: solo buscar por nombre del cliente
    const whereCondition: Prisma.SaleWhereInput = search
      ? {
          customer: {
            name: {
              contains: search,
              mode: "insensitive" as Prisma.QueryMode,
            },
          },
        }
      : {};

    const [sales, totalCount] = await Promise.all([
      prisma.sale.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: {
              name: true,
            },
          },
          user: {
            select: {
              name: true,
            },
          },
          saleItems: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
      }),
      prisma.sale.count({ where: whereCondition }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      sales,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Get user ID from the JWT token instead of next-auth session
    const user = await prisma.user.findUnique({
      where: { id: authResult.user.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body: CreateSaleRequest = await request.json();

    // Validar que hay items en la venta
    if (!body.saleItems || body.saleItems.length === 0) {
      return NextResponse.json(
        { error: "La venta debe tener al menos un producto" },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmount = body.saleItems.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    // Create sale with transaction to handle stock updates
    const sale = await prisma.$transaction(async (tx) => {
      // Create the sale
      const sale = await tx.sale.create({
        data: {
          customerId: body.customerId,
          userId: user.id,
          totalAmount,
          notes: body.notes,
          saleItems: {
            create: body.saleItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            })),
          },
        },
        include: {
          saleItems: {
            include: {
              product: true,
            },
          },
        },
      });

      // Update product stock for each sale item
      for (const item of sale.saleItems) {
        if (item.product.useStock) {
          // Verificar que haya suficiente stock
          const currentStock = item.product.stock || 0;
          if (currentStock < item.quantity) {
            throw new Error(
              `Stock insuficiente para el producto: ${item.product.name}`
            );
          }

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });

          // Create stock movement
          await tx.movement.create({
            data: {
              productId: item.productId,
              userId: user.id,
              type: "salida",
              quantity: item.quantity,
              previousStock: currentStock,
              newStock: currentStock - item.quantity,
              note: `Venta #${sale.id.slice(0, 8)}`,
            },
          });
        }
      }

      return sale;
    });

    return NextResponse.json({ sale }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating sale:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
