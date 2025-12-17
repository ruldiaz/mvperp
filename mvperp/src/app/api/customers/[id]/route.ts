import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { UpdateCustomerRequest } from "@/types/customer";

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
   GET /customers/:id
========================= */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  try {
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        companyId: auth.user.companyId,
      },
      include: {
        sales: {
          orderBy: { createdAt: "desc" },
          include: {
            saleItems: {
              include: {
                product: {
                  select: { name: true, sku: true },
                },
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("GET CUSTOMER ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* =========================
   PUT /customers/:id
========================= */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const body: UpdateCustomerRequest = await request.json();

  try {
    const customer = await prisma.customer.updateMany({
      where: {
        id,
        companyId: auth.user.companyId,
      },
      data: body,
    });

    if (customer.count === 0) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("UPDATE CUSTOMER ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE /customers/:id
========================= */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  try {
    const salesCount = await prisma.sale.count({
      where: {
        customerId: id,
        companyId: auth.user.companyId,
      },
    });

    if (salesCount > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un cliente con ventas" },
        { status: 400 }
      );
    }

    const deleted = await prisma.customer.deleteMany({
      where: {
        id,
        companyId: auth.user.companyId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("DELETE CUSTOMER ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
