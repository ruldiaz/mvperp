import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateQuotationRequest } from "@/types/sale";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";

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

    // CORRECCIÓN: Solo buscar por nombre del cliente, no por ID
    const whereCondition: Prisma.QuotationWhereInput = search
      ? {
          customer: {
            name: {
              contains: search,
              mode: "insensitive" as Prisma.QueryMode,
            },
          },
        }
      : {};

    const [quotations, totalCount] = await Promise.all([
      prisma.quotation.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
          user: {
            select: {
              name: true,
            },
          },
          quotationItems: {
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
      prisma.quotation.count({ where: whereCondition }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      quotations,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching quotations:", error);
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
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body: CreateQuotationRequest = await request.json();

    if (!body.quotationItems || body.quotationItems.length === 0) {
      return NextResponse.json(
        { error: "La cotización debe tener al menos un producto" },
        { status: 400 }
      );
    }

    // Calcular total
    const totalAmount = body.quotationItems.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    // Crear cotización
    const quotation = await prisma.quotation.create({
      data: {
        customerId: body.customerId,
        userId: user.id,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        totalAmount,
        notes: body.notes,
        quotationItems: {
          create: body.quotationItems.map((item) => ({
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
        customer: true,
        user: true,
        quotationItems: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json({ quotation }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating quotation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
