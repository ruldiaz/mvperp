// app/api/invoices/[id]/stamp/route.ts (corregido)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFacturamaService } from "@/lib/facturama";
import jwt from "jsonwebtoken";
import {
  getDefaultCfdiUse,
  validateExpeditionPlaceForRfc,
} from "@/lib/cfdiHelpers";
import { InvoiceValidator } from "@/lib/invoiceValidator";

const JWT_SECRET = process.env.JWT_SECRET;

// Add this function near the top, after imports
function roundToSixDecimals(value: number): number {
  return Math.round(value * 1000000) / 1000000;
}

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

    // Obtener la factura con toda la información necesaria
    const invoice = await prisma.invoice.findUnique({
      where: { id },
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

    if (invoice.status !== "pending") {
      return NextResponse.json(
        { error: "La factura ya ha sido procesada" },
        { status: 400 }
      );
    }

    // Validar que la compañía tiene los datos necesarios
    if (!invoice.company || !invoice.customer) {
      return NextResponse.json(
        { error: "Datos incompletos para facturar" },
        { status: 400 }
      );
    }

    // ✅ NUEVO: Validate invoice before stamping
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

    // ✅ NUEVO: Block stamping if validation errors exist
    if (!validationResult.canStamp) {
      console.error("Validation errors:", validationResult.errors);
      return NextResponse.json(
        {
          error: "La factura tiene errores de validación",
          validationErrors: validationResult.errors,
          validationWarnings: validationResult.warnings,
          details: "Corrija los errores antes de timbrar",
        },
        { status: 400 }
      );
    }

    // ✅ Log warnings (but allow stamping)
    if (validationResult.warnings.length > 0) {
      console.warn("Validation warnings:", validationResult.warnings);
    }

    // Preparar datos para Facturama
    const customerRfc = invoice.customer.rfc || "XAXX010101000";
    const customerTaxRegime = invoice.customer.taxRegime || "616";
    const customerZipCode = invoice.customer.fiscalPostalCode || "00000";

    // Obtener el mes actual en formato de dos dígitos (01-12)
    const currentMonth = (new Date().getMonth() + 1)
      .toString()
      .padStart(2, "0");

    const facturamaData = {
      // 👇 NUEVO: Agregar sección Issuer con datos de TU EMPRESA
      Issuer: {
        Rfc: invoice.company.rfc,
        Name: invoice.company.name,
        FiscalRegime: invoice.company.regime,
      },

      // 👇 EXISTENTE: Receptor (cliente)
      Receiver: {
        Name: invoice.customer.razonSocial || invoice.customer.name,
        CfdiUse: invoice.cfdiUse || getDefaultCfdiUse(customerTaxRegime),
        Rfc: customerRfc,
        FiscalRegime: customerTaxRegime,
        TaxZipCode: customerZipCode,
      },

      // 👇 AGREGAR ESTA SECCIÓN PARA CLIENTES GENÉRICOS
      GlobalInformation:
        customerRfc === "XAXX010101000"
          ? {
              Periodicity: "04", // Mensual
              Months: currentMonth, // 👈 Cambiar de "0" a "01", "02", ..., "12"
              Year: new Date().getFullYear().toString(),
            }
          : undefined,

      CfdiType: "I",
      NameId: "1",
      ExpeditionPlace: validateExpeditionPlaceForRfc(
        customerRfc,
        invoice.company.postalCode,
        customerZipCode
      ),
      Serie: invoice.serie || null,
      Folio: invoice.folio || null,
      PaymentForm: invoice.paymentForm || "01",
      PaymentMethod: invoice.paymentMethod || "PUE",
      Exportation: "01",
      // Then in the Items mapping, replace with:
      Items: invoice.invoiceItems.map((item) => {
        const subtotal = roundToSixDecimals(item.totalPrice);
        const taxAmount = roundToSixDecimals(subtotal * 0.16);
        const total = roundToSixDecimals(subtotal + taxAmount);

        return {
          Quantity: item.quantity,
          ProductCode: item.saleItem?.product?.satKey || "01010101",
          UnitCode: item.saleItem?.product?.satUnitKey || "H87",
          Unit: item.saleItem?.product?.saleUnit || "Pieza",
          Description:
            item.saleItem?.description ||
            item.saleItem?.product?.name ||
            "Producto o servicio",
          IdentificationNumber: item.saleItem?.product?.sku || undefined,
          UnitPrice: roundToSixDecimals(item.unitPrice),
          Subtotal: subtotal,
          TaxObject: "02",
          Taxes: [
            {
              Name: "IVA",
              Rate: 0.16,
              Total: taxAmount,
              Base: subtotal,
              IsRetention: false,
              IsFederalTax: true,
            },
          ],
          Total: total,
        };
      }),
    };

    console.log(
      "Enviando datos a Facturama:",
      JSON.stringify(facturamaData, null, 2)
    );

    // Get Facturama service instance based on company's testMode setting
    const facturamaService = getFacturamaService(invoice.company.testMode);
    console.log(`Using Facturama in ${invoice.company.testMode ? 'SANDBOX' : 'PRODUCTION'} mode`);

    // Timbrar con Facturama
    const facturamaResponse = await facturamaService.createCfdi(facturamaData);

    // Guardar ambos IDs
    const facturamaId = facturamaResponse.Id; // ID de Facturama (para PDF)
    const satUuid = facturamaResponse.Complement.TaxStamp.Uuid; // UUID fiscal del SAT
    const cfdiSign = facturamaResponse.Complement.TaxStamp.CfdiSign;

    console.log(`✅ CFDI timbrado exitosamente`);
    console.log(`Facturama ID: ${facturamaId}`);
    console.log(`SAT UUID: ${satUuid}`);

    // Obtener PDF usando el ID de Facturama (no el UUID del SAT)
    let pdfResponse;
    try {
      pdfResponse = await facturamaService.getPdf(facturamaId);
      console.log(
        `✅ PDF obtenido inmediatamente: ${pdfResponse.ContentLength} bytes`
      );
    } catch (error) {
      // CORRECCIÓN: Usar tipo unknown y verificar
      const pdfError = error as Error;
      console.log(
        "⚠️ PDF no disponible inmediatamente, se puede obtener más tarde:",
        pdfError.message
      );
      // No es error crítico, el PDF se puede obtener después
    }

    // Verificación adicional para evitar errores
    const issuerRfc = invoice.company.rfc;
    const receiverRfc = customerRfc;

    // Asegurarse de que los RFCs no sean iguales
    if (issuerRfc === receiverRfc) {
      console.warn("⚠️ ADVERTENCIA: RFC del emisor y receptor son iguales");
    }

    // Actualizar la factura en la base de datos - guardar ambos IDs
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: "stamped",
        uuid: satUuid, // UUID fiscal del SAT
        facturamaId: facturamaId, // ID de Facturama para PDF
        serie: facturamaResponse.Serie,
        folio: facturamaResponse.Folio,
        xmlUrl: `/api/invoices/${id}/xml`,
        pdfUrl: `/api/invoices/${id}/pdf`,
        subtotal: facturamaResponse.Subtotal,
        taxes: facturamaResponse.Total - facturamaResponse.Subtotal,
        verificationUrl: `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?&id=${satUuid}&re=${invoice.company.rfc}&rr=${customerRfc}&tt=${facturamaResponse.Total}&fe=${cfdiSign.slice(-8)}`,
        stampedAt: new Date(), // Este campo ahora existe en el modelo
      },
    });

    return NextResponse.json({
      success: true,
      message: "Factura timbrada correctamente",
      invoice: updatedInvoice,
      facturamaResponse: {
        facturamaId: facturamaResponse.Id,
        satUuid: facturamaResponse.Complement.TaxStamp.Uuid,
        serie: facturamaResponse.Serie,
        folio: facturamaResponse.Folio,
        total: facturamaResponse.Total,
        date: facturamaResponse.Date,
      },
      pdfUrl: `/api/invoices/${id}/pdf`,
      pdfAvailable: !!pdfResponse,
    });
  } catch (error) {
    // CORRECCIÓN: Evitar el tipo 'any'
    console.error("Error stamping invoice:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";

    // Error específico de Facturama
    if (errorMessage.includes("Error creating CFDI")) {
      return NextResponse.json(
        {
          error: "Error al timbrar con Facturama",
          message: errorMessage,
          details: "Verifica los datos fiscales del cliente y la empresa",
        },
        { status: 400 }
      );
    }

    // Error de autenticación
    if (
      errorMessage.includes("autenticación") ||
      errorMessage.includes("401")
    ) {
      return NextResponse.json(
        {
          error: "Error de autenticación con Facturama",
          message:
            "Verifica las credenciales de Facturama en las variables de entorno",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Error al timbrar la factura",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
