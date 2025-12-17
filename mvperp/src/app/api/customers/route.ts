import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import { CreateCustomerRequest } from "@/types/customer";

const JWT_SECRET = process.env.JWT_SECRET;

/* =========================
   AUTH
========================= */
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
      companyId: string;
    };

    return { user: payload };
  } catch {
    return { error: "Token inválido o expirado", status: 401 };
  }
}

/* =========================
   GET /customers
========================= */
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";

  const skip = (page - 1) * limit;

  const where: Prisma.CustomerWhereInput = {
    companyId: auth.user.companyId,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  try {
    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { sales: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("GET CUSTOMERS ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* =========================
   POST /customers
========================= */
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body: CreateCustomerRequest = await request.json();

    const customer = await prisma.customer.create({
      data: {
        companyId: auth.user.companyId, // 🔐 CLAVE
        name: body.name,
        razonSocial: body.razonSocial,
        email: body.email,
        phone: body.phone,
        address: body.address,
        rfc: body.rfc,
        usoCFDI: body.usoCFDI,
        taxRegime: body.taxRegime,
        fiscalAddress: body.fiscalAddress,
        fiscalStreet: body.fiscalStreet,
        fiscalExteriorNumber: body.fiscalExteriorNumber,
        fiscalInteriorNumber: body.fiscalInteriorNumber,
        fiscalNeighborhood: body.fiscalNeighborhood,
        fiscalPostalCode: body.fiscalPostalCode,
        fiscalCity: body.fiscalCity,
        fiscalState: body.fiscalState,
        fiscalMunicipality: body.fiscalMunicipality,
        fiscalCountry: body.fiscalCountry,
      },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error("CREATE CUSTOMER ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
