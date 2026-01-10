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
  // Strangler feature flag - AGREGAR ESTO
  const USE_V2 = process.env.USE_CUSTOMERS_V2 === "true";
  if (USE_V2) {
    try {
      // Proxy la request a v2
      const { id } = await params;
      const v2Url = new URL(`/api/customers/v2/${id}`, request.url);

      const v2Response = await fetch(v2Url.toString(), {
        method: "GET",
        headers: Object.fromEntries(request.headers.entries()),
      });

      return new NextResponse(v2Response.body, {
        status: v2Response.status,
        headers: v2Response.headers,
      });
    } catch (error) {
      console.error("Error proxying GET to v2:", error);
      // Si falla, cae back al legacy
    }
  }
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
  // Strangler feature flag
  const USE_V2 = process.env.USE_CUSTOMERS_V2 === "true";
  if (USE_V2) {
    try {
      // Proxy la request a v2
      const { id } = await params;
      const v2Url = new URL(`/api/customers/v2/${id}`, request.url);

      const v2Response = await fetch(v2Url.toString(), {
        method: "PUT",
        headers: Object.fromEntries(request.headers.entries()),
        body: await request.text(),
      });

      return new NextResponse(v2Response.body, {
        status: v2Response.status,
        headers: v2Response.headers,
      });
    } catch (error) {
      console.error("Error proxying PUT to v2:", error);
      // Si falla, cae back al legacy
    }
  }
  const auth = await verifyAuth(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const body: UpdateCustomerRequest = await request.json();

  try {
    // First check if customer exists and belongs to the company
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        companyId: auth.user.companyId,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Update and return the updated customer
    const updatedCustomer = await prisma.customer.update({
      where: {
        id,
      },
      data: body,
    });

    return NextResponse.json({ customer: updatedCustomer });
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
  // Strangler feature flag
  const USE_V2 = process.env.USE_CUSTOMERS_V2 === "true";
  if (USE_V2) {
    try {
      // Proxy la request a v2
      const { id } = await params;
      const v2Url = new URL(`/api/customers/v2/${id}`, request.url);

      const v2Response = await fetch(v2Url.toString(), {
        method: "DELETE",
        headers: Object.fromEntries(request.headers.entries()),
      });

      return new NextResponse(v2Response.body, {
        status: v2Response.status,
        headers: v2Response.headers,
      });
    } catch (error) {
      console.error("Error proxying DELETE to v2:", error);
      // Si falla, cae back al legacy
    }
  }
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
