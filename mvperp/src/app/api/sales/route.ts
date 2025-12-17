// src/app/api/sales/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateSaleRequest } from "@/types/sale";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtPayload {
  userId: string;
  companyId: string;
  email: string;
  name?: string;
}

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
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!payload.companyId) {
      return { error: "No se pudo identificar la empresa", status: 400 };
    }
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

    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const customerId = searchParams.get("customerId") || "";
    const status = searchParams.get("status") || "";

    const skip = (page - 1) * limit;

    // Construir condición WHERE con companyId
    const whereCondition: Prisma.SaleWhereInput = {
      companyId: user.companyId, // ← FILTRADO POR EMPRESA
    };

    // Añadir búsqueda por nombre del cliente si existe
    if (search) {
      whereCondition.customer = {
        name: {
          contains: search,
          mode: "insensitive" as Prisma.QueryMode,
        },
      };
    }

    // Filtrar por cliente si se especifica
    if (customerId) {
      whereCondition.customerId = customerId;
    }

    // Filtrar por estado si se especifica
    if (status) {
      whereCondition.status = status;
    }

    // Verificar que el cliente pertenezca a la empresa (si se especifica)
    if (customerId) {
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          companyId: user.companyId,
        },
      });

      if (!customer) {
        return NextResponse.json(
          { error: "Cliente no encontrado o no pertenece a esta empresa" },
          { status: 404 }
        );
      }
    }

    const [sales, totalCount] = await Promise.all([
      prisma.sale.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          saleItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  satKey: true,
                  satUnitKey: true,
                },
              },
            },
          },
          invoices: {
            select: {
              id: true,
              status: true,
              serie: true,
              folio: true,
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

    const { user } = authResult;

    // Verificar que el usuario tenga empresa asignada
    const userWithCompany = await prisma.user.findUnique({
      where: {
        id: user.userId,
        companyId: user.companyId, // Verificar que el usuario pertenece a la empresa
      },
    });

    if (!userWithCompany) {
      return NextResponse.json(
        { error: "Usuario no encontrado o no tiene empresa asignada" },
        { status: 404 }
      );
    }

    const body: CreateSaleRequest = await request.json();

    // Validaciones básicas
    if (!body.customerId) {
      return NextResponse.json(
        { error: "El cliente es requerido" },
        { status: 400 }
      );
    }

    if (!body.saleItems || body.saleItems.length === 0) {
      return NextResponse.json(
        { error: "La venta debe tener al menos un producto" },
        { status: 400 }
      );
    }

    // Verificar que el cliente pertenece a la misma empresa
    const customer = await prisma.customer.findFirst({
      where: {
        id: body.customerId,
        companyId: user.companyId,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Cliente no encontrado o no pertenece a esta empresa" },
        { status: 404 }
      );
    }

    // Verificar que los productos pertenecen a la misma empresa
    for (const item of body.saleItems) {
      const product = await prisma.product.findFirst({
        where: {
          id: item.productId,
          companyId: user.companyId,
        },
      });

      if (!product) {
        return NextResponse.json(
          {
            error: `Producto con ID ${item.productId} no encontrado o no pertenece a esta empresa`,
          },
          { status: 404 }
        );
      }

      // Verificar stock si el producto usa control de inventario
      if (product.useStock && (product.stock || 0) < item.quantity) {
        return NextResponse.json(
          {
            error: `Stock insuficiente para el producto: ${product.name}. Stock disponible: ${product.stock || 0}`,
          },
          { status: 400 }
        );
      }
    }

    // Calcular total
    const totalAmount = body.saleItems.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    // Crear venta con transacción
    const sale = await prisma.$transaction(async (tx) => {
      // Crear la venta (usar valor por defecto para status)
      const sale = await tx.sale.create({
        data: {
          companyId: user.companyId, // ← AÑADIR companyId
          customerId: body.customerId,
          userId: user.userId,
          totalAmount,
          notes: body.notes,
          // El status será el valor por defecto definido en el schema ("completed")
          saleItems: {
            create: body.saleItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
              satProductKey: item.satProductKey,
              satUnitKey: item.satUnitKey,
              description: item.description,
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

      // Actualizar stock y crear movimientos
      for (const item of sale.saleItems) {
        if (item.product.useStock) {
          const currentStock = item.product.stock || 0;
          const newStock = currentStock - item.quantity;

          await tx.product.update({
            where: {
              id: item.productId,
              companyId: user.companyId, // Seguridad adicional
            },
            data: {
              stock: newStock,
            },
          });

          // Crear movimiento de stock
          await tx.movement.create({
            data: {
              productId: item.productId,
              userId: user.userId,
              type: "salida",
              quantity: item.quantity,
              previousStock: currentStock,
              newStock: newStock,
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

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
