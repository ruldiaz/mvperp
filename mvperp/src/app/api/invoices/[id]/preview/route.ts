// app/api/invoices/[id]/preview/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { InvoiceValidator } from "@/lib/invoiceValidator";
import { CfdiPdfGenerator } from "@/lib/cfdiPdfGenerator";
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
      companyId: string;
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

    // Get query parameter to determine if we want validation only or PDF
    const url = new URL(request.url);
    const validateOnly = url.searchParams.get("validate") === "true";

    // Fetch invoice with all related data
    const invoice = await prisma.invoice.findUnique({
      where: { 
        id,
        companyId: authResult.user.companyId // Ensure user can only access their company's invoices
      },
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

    if (!invoice) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }

    // Validate invoice data
    const validator = new InvoiceValidator();
    const validationResult = validator.validate({
      invoice: {
        id: invoice.id,
        status: invoice.status,
        paymentMethod: invoice.paymentMethod,
        paymentForm: invoice.paymentForm,
        cfdiUse: invoice.cfdiUse,
        subtotal: invoice.subtotal,
        taxes: invoice.taxes,
      },
      company: {
        id: invoice.company.id,
        rfc: invoice.company.rfc,
        name: invoice.company.name,
        regime: invoice.company.regime,
        postalCode: invoice.company.postalCode,
        csdCert: invoice.company.csdCert,
        csdKey: invoice.company.csdKey,
        csdPassword: invoice.company.csdPassword,
      },
      customer: {
        id: invoice.customer.id,
        name: invoice.customer.name,
        email: invoice.customer.email,
        rfc: invoice.customer.rfc,
        razonSocial: invoice.customer.razonSocial,
        taxRegime: invoice.customer.taxRegime,
        fiscalAddress: invoice.customer.fiscalAddress,
        fiscalPostalCode: invoice.customer.fiscalPostalCode,
        usoCFDI: invoice.customer.usoCFDI,
      },
      items: invoice.invoiceItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        saleItem: item.saleItem
          ? {
              description: item.saleItem.description,
              product: item.saleItem.product
                ? {
                    name: item.saleItem.product.name,
                    sku: item.saleItem.product.sku,
                    satKey: item.saleItem.product.satKey,
                    satUnitKey: item.saleItem.product.satUnitKey,
                    saleUnit: item.saleItem.product.saleUnit,
                    iva: item.saleItem.product.iva,
                    ieps: item.saleItem.product.ieps,
                  }
                : null,
            }
          : null,
      })),
    });

    // If validation only, return validation results
    if (validateOnly) {
      return NextResponse.json({
        validation: validationResult,
        invoice: {
          id: invoice.id,
          status: invoice.status,
          serie: invoice.serie,
          folio: invoice.folio,
        },
      });
    }

    // Generate PDF preview
    const pdfGenerator = new CfdiPdfGenerator();
    const pdfBlob = await pdfGenerator.generate(
      {
        id: invoice.id,
        serie: invoice.serie,
        folio: invoice.folio,
        createdAt: invoice.createdAt,
        subtotal: invoice.subtotal,
        taxes: invoice.taxes,
        paymentMethod: invoice.paymentMethod,
        paymentForm: invoice.paymentForm,
        cfdiUse: invoice.cfdiUse,
        company: {
          rfc: invoice.company.rfc,
          name: invoice.company.name,
          regime: invoice.company.regime,
          postalCode: invoice.company.postalCode,
          address: `${invoice.company.street || ""} ${invoice.company.exteriorNumber || ""}`.trim() || undefined,
        },
        customer: {
          name: invoice.customer.name,
          rfc: invoice.customer.rfc,
          razonSocial: invoice.customer.razonSocial,
          taxRegime: invoice.customer.taxRegime,
          fiscalPostalCode: invoice.customer.fiscalPostalCode,
          usoCFDI: invoice.customer.usoCFDI,
        },
        items: invoice.invoiceItems.map((item) => ({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          saleItem: item.saleItem
            ? {
                description: item.saleItem.description,
                product: item.saleItem.product
                  ? {
                      name: item.saleItem.product.name,
                      sku: item.saleItem.product.sku,
                      satKey: item.saleItem.product.satKey,
                      satUnitKey: item.saleItem.product.satUnitKey,
                      saleUnit: item.saleItem.product.saleUnit,
                    }
                  : null,
              }
            : null,
        })),
      },
      true // isPreview = true
    );

    // Convert Blob to Buffer for Next.js response
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return PDF with validation results in headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="preview-factura-${invoice.serie || ""}-${invoice.folio || invoice.id.slice(0, 8)}.pdf"`,
        "X-Validation-Status": validationResult.isValid ? "valid" : "invalid",
        "X-Validation-Errors": JSON.stringify(validationResult.errors),
        "X-Validation-Warnings": JSON.stringify(validationResult.warnings),
        "X-Can-Stamp": validationResult.canStamp.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error generating invoice preview:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";

    return NextResponse.json(
      {
        error: "Error al generar la previsualización",
        message: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
