import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { parse } from "csv-parse/sync";
import {
  CSVImportConfig,
  ImportResult,
  ImportDetail,
} from "@/types/product-import";

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtPayload {
  userId: string;
  companyId: string;
}

/* =========================
   Helpers
========================= */
const parseNumber = (value: string): number => {
  if (!value) return 0;
  const cleaned = value.replace(/[^\d.,]/g, "");
  const normalized = cleaned.replace(",", ".");
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
};

const parseBoolean = (value: string): boolean => {
  if (!value) return false;
  const val = value.toString().toLowerCase().trim();
  return ["true", "1", "si", "sí", "yes"].includes(val);
};

/* =========================
   POST /api/products/import
========================= */
export async function POST(req: NextRequest) {
  if (!JWT_SECRET) {
    return NextResponse.json(
      { error: "JWT secret no definido" },
      { status: 500 }
    );
  }

  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const configJson = formData.get("config") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó archivo" },
        { status: 400 }
      );
    }

    const config: CSVImportConfig = configJson
      ? JSON.parse(configJson)
      : {
          delimiter: ",",
          hasHeaders: true,
          mapping: {
            name: "name",
            type: "type",
            barcode: "barcode",
            category: "category",
            sku: "sku",
            sellAtPOS: "sellAtPOS",
            includeInCatalog: "includeInCatalog",
            requirePrescription: "requirePrescription",
            saleUnit: "saleUnit",
            brand: "brand",
            description: "description",
            useStock: "useStock",
            quantity: "quantity",
            price: "price",
            cost: "cost",
            stock: "stock",
            image: "image",
            location: "location",
            minimumQuantity: "minimumQuantity",
            satKey: "satKey",
            iva: "iva",
            ieps: "ieps",
            satUnitKey: "satUnitKey",
            ivaIncluded: "ivaIncluded",
          },
        };

    const buffer = Buffer.from(await file.arrayBuffer()).toString("utf-8");

    const records: string[][] = parse(buffer, {
      delimiter: config.delimiter,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    const headers: string[] = config.hasHeaders ? records[0] : [];
    const startRow = config.hasHeaders ? 1 : 0;

    const result: ImportResult = {
      success: 0,
      errors: 0,
      details: [],
    };

    for (let i = startRow; i < records.length; i++) {
      const row = records[i];

      const detail: ImportDetail = {
        row: i + 1,
        productName: "",
        status: "error",
        message: "",
      };

      try {
        const productData: Record<string, string> = {};

        Object.entries(config.mapping).forEach(([field, column]) => {
          let index = -1;

          if (config.hasHeaders && column) {
            index = headers.findIndex(
              (h: string) =>
                h.toLowerCase().trim() ===
                column.toString().toLowerCase().trim()
            );
          } else if (column) {
            const colIndex = parseInt(column.toString());
            index = isNaN(colIndex) ? -1 : colIndex;
          }

          productData[field] =
            index >= 0 && index < row.length ? row[index] : "";
        });

        detail.productName = productData.name || `Fila ${i + 1}`;

        if (!productData.name) {
          throw new Error("Nombre es requerido");
        }

        const productPayload = {
          companyId: payload.companyId,
          userId: payload.userId,
          name: productData.name,
          type: productData.type || "producto",
          barcode: productData.barcode || undefined,
          category: productData.category || undefined,
          sku: productData.sku || undefined,
          sellAtPOS: parseBoolean(productData.sellAtPOS),
          includeInCatalog: parseBoolean(productData.includeInCatalog),
          requirePrescription: parseBoolean(productData.requirePrescription),
          saleUnit: productData.saleUnit || undefined,
          brand: productData.brand || undefined,
          description: productData.description || undefined,
          useStock: productData.useStock
            ? parseBoolean(productData.useStock)
            : true,
          quantity: parseNumber(productData.quantity),
          price: parseNumber(productData.price),
          cost: parseNumber(productData.cost),
          stock: parseNumber(productData.stock || productData.quantity || "0"),
          image: productData.image || undefined,
          location: productData.location || undefined,
          minimumQuantity: productData.minimumQuantity
            ? parseNumber(productData.minimumQuantity)
            : undefined,
          satKey: productData.satKey || undefined,
          iva: productData.iva ? parseNumber(productData.iva) : undefined,
          ieps: productData.ieps ? parseNumber(productData.ieps) : undefined,
          satUnitKey: productData.satUnitKey || undefined,
          ivaIncluded: productData.ivaIncluded
            ? parseBoolean(productData.ivaIncluded)
            : true,
        };

        /* ===== Buscar duplicado SOLO en la empresa ===== */
        const orConditions = [];

        if (productPayload.sku) {
          orConditions.push({ sku: productPayload.sku });
        }
        orConditions.push({ name: productPayload.name });

        const existingProduct = await prisma.product.findFirst({
          where: {
            companyId: payload.companyId,
            OR: orConditions,
          },
        });

        if (existingProduct) {
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: productPayload,
          });
          detail.message = "Producto actualizado";
        } else {
          await prisma.product.create({
            data: productPayload,
          });
          detail.message = "Producto creado";
        }

        detail.status = "success";
        result.success++;
      } catch (err: unknown) {
        detail.message =
          err instanceof Error ? err.message : "Error desconocido";
        result.errors++;
      }

      result.details.push(detail);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Error al procesar el archivo CSV" },
      { status: 500 }
    );
  }
}
