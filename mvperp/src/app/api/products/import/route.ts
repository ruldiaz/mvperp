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
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const configJson = formData.get("config") as string;

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

    const fileBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(fileBuffer).toString("utf-8");

    const records = parse(fileContent, {
      delimiter: config.delimiter,
      skip_empty_lines: true,
      relax_column_count: true,
    });

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
        // Map CSV columns to product fields based on configuration
        const productData: Record<string, string> = {};
        Object.entries(config.mapping).forEach(([field, columnName]) => {
          const columnIndex = Object.values(config.mapping).indexOf(columnName);
          if (columnIndex >= 0 && columnIndex < row.length) {
            productData[field] = row[columnIndex]?.trim() || "";
          }
        });

        detail.productName = productData.name || `Fila ${i + 1}`;

        // Validate required fields
        if (!productData.name) {
          throw new Error("Nombre es requerido");
        }

        // Convert string values to appropriate types
        const product = {
          userId: payload.userId,
          name: productData.name,
          type: productData.type || "producto",
          barcode: productData.barcode || undefined,
          category: productData.category || undefined,
          sku: productData.sku || undefined,
          sellAtPOS:
            productData.sellAtPOS?.toLowerCase() === "true" ||
            productData.sellAtPOS === "1",
          includeInCatalog:
            productData.includeInCatalog?.toLowerCase() === "true" ||
            productData.includeInCatalog === "1",
          requirePrescription:
            productData.requirePrescription?.toLowerCase() === "true" ||
            productData.requirePrescription === "1",
          saleUnit: productData.saleUnit || undefined,
          brand: productData.brand || undefined,
          description: productData.description || undefined,
          useStock:
            productData.useStock?.toLowerCase() === "true" ||
            productData.useStock === "1" ||
            true,
          quantity: productData.quantity ? parseFloat(productData.quantity) : 0,
          price: productData.price ? parseFloat(productData.price) : 0,
          cost: productData.cost ? parseFloat(productData.cost) : 0,
          stock: productData.stock
            ? parseFloat(productData.stock)
            : productData.quantity
              ? parseFloat(productData.quantity)
              : 0,
          image: productData.image || undefined,
          location: productData.location || undefined,
          minimumQuantity: productData.minimumQuantity
            ? parseFloat(productData.minimumQuantity)
            : undefined,
          satKey: productData.satKey || undefined,
          iva: productData.iva ? parseFloat(productData.iva) : undefined,
          ieps: productData.ieps ? parseFloat(productData.ieps) : undefined,
          satUnitKey: productData.satUnitKey || undefined,
          ivaIncluded:
            productData.ivaIncluded?.toLowerCase() === "true" ||
            productData.ivaIncluded === "1" ||
            true,
        };

        // Check if product already exists (by SKU or name)
        const existingProduct = await prisma.product.findFirst({
          where: {
            userId: payload.userId,
            OR: [{ sku: product.sku || "" }, { name: product.name }],
          },
        });

        if (existingProduct) {
          // Update existing product
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: product,
          });
          detail.message = "Producto actualizado";
        } else {
          // Create new product
          await prisma.product.create({
            data: product,
          });
          detail.message = "Producto creado";
        }

        detail.status = "success";
        result.success++;
      } catch (error: unknown) {
        detail.status = "error";
        detail.message =
          error instanceof Error ? error.message : "Error desconocido";
        result.errors++;
      }

      result.details.push(detail);
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Error processing CSV file" },
      { status: 500 }
    );
  }
}
