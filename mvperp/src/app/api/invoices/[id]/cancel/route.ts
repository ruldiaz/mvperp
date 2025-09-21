// src/app/api/invoices/[id]/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { facturamaService } from "@/lib/facturama";
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

// En app/api/invoices/[id]/cancel/route.ts
export async function POST(
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

    const body: { motivo: string; folioSustituto?: string } =
      await request.json();
    const { motivo, folioSustituto } = body;

    if (!motivo) {
      return NextResponse.json(
        { error: "El motivo de cancelación es requerido" },
        { status: 400 }
      );
    }

    // Validar que el motivo sea válido
    const motivosValidos = ["01", "02", "03", "04"];
    if (!motivosValidos.includes(motivo)) {
      return NextResponse.json(
        { error: "Motivo de cancelación no válido" },
        { status: 400 }
      );
    }

    // Validar folioSustituto para motivo 01
    if (motivo === "01" && !folioSustituto) {
      return NextResponse.json(
        { error: "El folio sustituto es requerido para el motivo 01" },
        { status: 400 }
      );
    }

    // Validar que folioSustituto sea un UUID válido para motivo 01
    if (motivo === "01" && folioSustituto) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(folioSustituto)) {
        return NextResponse.json(
          { error: "El folio sustituto debe ser un UUID válido" },
          { status: 400 }
        );
      }
    }

    // Obtener la factura
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        company: true,
        customer: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }

    if (invoice.status !== "stamped") {
      return NextResponse.json(
        {
          error: "Solo se pueden cancelar facturas timbradas",
          currentStatus: invoice.status,
        },
        { status: 400 }
      );
    }

    if (!invoice.facturamaId) {
      return NextResponse.json(
        { error: "La factura no tiene ID de Facturama" },
        { status: 400 }
      );
    }

    console.log(`Cancelando factura Facturama ID: ${invoice.facturamaId}`);
    console.log(`UUID SAT: ${invoice.uuid}`);
    console.log(`Motivo: ${motivo}`);
    if (folioSustituto) {
      console.log(`Folio sustituto: ${folioSustituto}`);
    }

    // Cancelar en Facturama
    const cancelResponse = await facturamaService.cancelCfdi(
      invoice.facturamaId,
      motivo,
      folioSustituto
    );

    console.log("Respuesta de cancelación:", cancelResponse);

    // Actualizar la factura en la base de datos
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status:
          cancelResponse.Status.toLowerCase() === "canceled"
            ? "cancelled"
            : "stamped",
        cancellationStatus: cancelResponse.Status,
        cancellationReceipt: cancelResponse.Message,
        cancelledAt: cancelResponse.CancelationDate
          ? new Date(cancelResponse.CancelationDate)
          : new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Factura cancelada correctamente",
      invoice: updatedInvoice,
      facturamaResponse: cancelResponse,
    });
  } catch (error) {
    console.error("Error canceling invoice:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";

    return NextResponse.json(
      {
        error: "Error al cancelar la factura",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

// También puedes agregar un endpoint GET para verificar el estado de cancelación
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

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        company: true,
        customer: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      invoice,
      canBeCancelled: invoice.status === "stamped" && !!invoice.facturamaId,
    });
  } catch (error) {
    console.error("Error checking cancellation status:", error);
    return NextResponse.json(
      { error: "Error al verificar estado de cancelación" },
      { status: 500 }
    );
  }
}
