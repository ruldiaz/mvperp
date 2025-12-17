// app/api/invoices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateInvoiceRequest } from "@/types/invoice";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET;

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

// app/api/invoices/route.ts (parte GET corregida)
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

    // Usar el tipo correcto de Prisma para la condición where
    const whereCondition: Prisma.InvoiceWhereInput = {};

    if (search) {
      whereCondition.OR = [
        {
          customer: {
            name: {
              contains: search,
              mode: "insensitive" as Prisma.QueryMode,
            },
          },
        },
        {
          serie: {
            contains: search,
            mode: "insensitive" as Prisma.QueryMode,
          },
        },
        {
          folio: {
            contains: search,
            mode: "insensitive" as Prisma.QueryMode,
          },
        },
      ];
    }

    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: {
              name: true,
              rfc: true,
              email: true,
            },
          },
          sale: {
            select: {
              id: true,
              date: true,
            },
          },
          company: {
            select: {
              name: true,
              rfc: true,
            },
          },
          invoiceItems: {
            include: {
              saleItem: {
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
          },
        },
      }),
      prisma.invoice.count({ where: whereCondition }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
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

    const user = await prisma.user.findUnique({
      where: { id: authResult.user.userId },
      include: { company: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validar que la compañía existe
    if (!user.company) {
      return NextResponse.json(
        { error: "Primero debe configurar los datos fiscales de la empresa" },
        { status: 400 }
      );
    }

    const body: CreateInvoiceRequest = await request.json();

    // Validaciones
    if (!body.customerId) {
      return NextResponse.json(
        { error: "Se requiere un cliente" },
        { status: 400 }
      );
    }

    if (!body.invoiceItems || body.invoiceItems.length === 0) {
      return NextResponse.json(
        { error: "La factura debe tener al menos un item" },
        { status: 400 }
      );
    }

    // Validar items para facturas directas
    if (!body.saleId) {
      const invalidItems = body.invoiceItems.filter((item) => !item.productId);
      if (invalidItems.length > 0) {
        return NextResponse.json(
          {
            error:
              "Para facturas directas, todos los items deben tener un productId",
          },
          { status: 400 }
        );
      }
    }

    // Calcular totales
    const subtotal = body.invoiceItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const taxes = subtotal * 0.16; // IVA 16%
    const total = subtotal + taxes;

    // Crear la factura con transacción
    const invoice = await prisma.$transaction(async (tx) => {
      let saleIdForInvoice = body.saleId;

      // Si es una factura directa (sin saleId), crear una venta dummy primero
      if (!body.saleId) {
        const dummySale = await tx.sale.create({
          data: {
            customerId: body.customerId,
            userId: user.id,
            companyId: user.company!.id, // ← AÑADIDO companyId
            totalAmount: total,
            status: "completed",
            date: new Date(),
            notes: "Venta automática generada para factura directa",
          },
        });
        saleIdForInvoice = dummySale.id;
      }

      // Asegurar que saleIdForInvoice no sea undefined
      const finalSaleId = saleIdForInvoice!;

      // Crear la factura
      const invoice = await tx.invoice.create({
        data: {
          saleId: finalSaleId,
          customerId: body.customerId,
          companyId: user.company!.id,
          paymentMethod: body.paymentMethod || "PUE",
          paymentForm: body.paymentForm || "01",
          currency: body.currency || "MXN",
          exchangeRate: body.exchangeRate || 1,
          subtotal,
          taxes,
          cfdiUse: body.cfdiUse || "G03",
          status: "pending",
        },
      });

      // Crear los items de la factura
      for (const item of body.invoiceItems) {
        let saleItemId: string;

        if (body.saleId) {
          // Para facturas de ventas existentes, validar que productId esté definido
          if (!item.productId) {
            throw new Error(
              "ProductId es requerido para facturas de ventas existentes"
            );
          }

          // Buscar el saleItem existente
          const saleItem = await tx.saleItem.findFirst({
            where: {
              saleId: body.saleId,
              productId: item.productId,
            },
          });

          if (!saleItem) {
            throw new Error(
              `No se encontró el item de venta para el producto ${item.productId}`
            );
          }

          saleItemId = saleItem.id;
        } else {
          // Para facturas directas, crear un nuevo saleItem
          const newSaleItem = await tx.saleItem.create({
            data: {
              saleId: finalSaleId,
              productId: item.productId!,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
              description: item.description,
              satProductKey: item.satProductKey,
              satUnitKey: item.satUnitKey,
            },
          });
          saleItemId = newSaleItem.id;
        }

        // Crear el invoiceItem
        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            saleItemId: saleItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          },
        });
      }

      // Obtener la factura completa con sus relaciones
      return await tx.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          customer: true,
          company: true,
          invoiceItems: {
            include: {
              saleItem: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating invoice:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
