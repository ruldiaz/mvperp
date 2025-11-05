import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UpdateQuotationRequest } from "@/types/sale";
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await verifyAuth(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        user: {
          select: {
            name: true,
          },
        },
        quotationItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                description: true,
                satKey: true,
                satUnitKey: true,
              },
            },
          },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ quotation });
  } catch (error) {
    console.error("Error fetching quotation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await verifyAuth(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body: UpdateQuotationRequest = await request.json();

    const quotation = await prisma.quotation.update({
      where: { id },
      data: {
        customerId: body.customerId,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        status: body.status,
        notes: body.notes,
      },
    });

    return NextResponse.json({ quotation });
  } catch (error) {
    console.error("Error updating quotation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await verifyAuth(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Eliminar items primero
      await tx.quotationItem.deleteMany({
        where: { quotationId: id },
      });

      // Eliminar cotización
      await tx.quotation.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: "Quotation deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting quotation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
