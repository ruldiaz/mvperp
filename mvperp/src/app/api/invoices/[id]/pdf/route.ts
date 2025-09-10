// app/api/invoices/[id]/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { facturamaService } from "@/lib/facturama";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let invoice = null;

  try {
    const { id } = await params;

    invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }

    if (!invoice.facturamaId) {
      return NextResponse.json(
        {
          error: "Factura no tiene ID de Facturama",
          message: "La factura necesita ser timbrada primero con Facturama",
        },
        { status: 400 }
      );
    }

    console.log(`Buscando PDF para Facturama ID: ${invoice.facturamaId}`);
    if (invoice.uuid) {
      console.log(`UUID SAT: ${invoice.uuid}`);
    }

    // Obtener PDF de Facturama
    const pdfResponse = await facturamaService.getPdf(invoice.facturamaId);
    console.log(`✅ PDF obtenido: ${pdfResponse.ContentLength} bytes`);

    // Convertir base64 a buffer
    const pdfBuffer = Buffer.from(pdfResponse.Content, "base64");

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="factura-${invoice.serie || ""}-${invoice.folio || id}.pdf"`,
        "Cache-Control": "public, max-age=86400", // Cache por 24 horas
        "X-PDF-Status": "ready",
        "X-CFDI-ID": invoice.uuid || "",
        "X-Facturama-ID": invoice.facturamaId,
      },
    });
  } catch (error) {
    console.error("Error obteniendo PDF:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";

    return NextResponse.json(
      {
        error: "Error al obtener el PDF",
        message: errorMessage,
        facturamaId: invoice?.facturamaId,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// 👇 NO exportes otros métodos a menos que los necesites
// export async function POST() {} // ❌
// export async function PUT() {} // ❌
// export async function DELETE() {} // ❌
