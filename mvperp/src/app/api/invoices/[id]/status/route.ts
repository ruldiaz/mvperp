// app/api/invoices/[id]/pdf/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { facturamaService } from "@/lib/facturama";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice || !invoice.facturamaId) {
      return NextResponse.json(
        { error: "Factura no encontrada o no timbrada" },
        { status: 404 }
      );
    }

    // Intentar obtener el estado del PDF
    let pdfAvailable = false;
    let pdfSize = 0;
    let lastError: string | null = null;

    try {
      const pdfResponse = await facturamaService.getPdf(invoice.facturamaId);
      pdfAvailable = true;
      pdfSize = pdfResponse.ContentLength;
    } catch (error) {
      // Corrección: Manejar el tipo unknown correctamente
      lastError = error instanceof Error ? error.message : "Error desconocido";
    }

    return NextResponse.json({
      invoiceId: id,
      cfdiId: invoice.uuid,
      facturamaId: invoice.facturamaId,
      pdfAvailable,
      pdfSize,
      lastChecked: new Date().toISOString(),
      lastError: pdfAvailable ? null : lastError,
      pdfUrl: pdfAvailable ? `/api/invoices/${id}/pdf` : null,
      facturamaUrl: `https://apisandbox.facturama.mx/cfdi/pdf/issued/${invoice.facturamaId}`,
    });
  } catch (error) {
    console.error("Error checking PDF status:", error);

    // Corrección: Manejar el tipo unknown en el catch principal también
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";

    return NextResponse.json(
      {
        error: "Error al verificar estado del PDF",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
