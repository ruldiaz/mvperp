// src/app/dashboard/products/import/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CSVProduct,
  ImportResult,
  CSVImportConfig,
  FieldMapping,
} from "@/types/product-import";

const defaultMapping: FieldMapping = {
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
};

export default function ImportProducts() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [config, setConfig] = useState<CSVImportConfig>({
    delimiter: ",",
    hasHeaders: true,
    mapping: defaultMapping,
  });
  const [previewData, setPreviewData] = useState<CSVProduct[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showMapping, setShowMapping] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);

  // Función mejorada para parsear líneas CSV
  const parseCSVLine = (line: string, delimiter: string): string[] => {
    // Si es tabulador, es más simple
    if (delimiter === "\t") {
      return line.split("\t").map((field) => field.trim());
    }

    // Para comas y punto y coma, manejar campos entre comillas
    const result: string[] = [];
    let currentField = "";
    let inQuotes = false;
    let quoteChar = "";

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        continue;
      }

      if (char === quoteChar && inQuotes) {
        // Verificar si es una comilla escapada (siguiente carácter es también comilla)
        if (i + 1 < line.length && line[i + 1] === quoteChar) {
          currentField += char;
          i++; // Saltar la siguiente comilla
        } else {
          inQuotes = false;
        }
        continue;
      }

      if (char === delimiter && !inQuotes) {
        result.push(currentField.trim());
        currentField = "";
        continue;
      }

      currentField += char;
    }

    // Añadir el último campo
    result.push(currentField.trim());
    return result;
  };

  // Obtener valor basado en el mapeo
  const getValueByMapping = (
    field: keyof FieldMapping,
    values: string[],
    headers: string[],
    config: CSVImportConfig
  ): string => {
    const columnName = config.mapping[field];

    if (config.hasHeaders && headers.length > 0) {
      const index = headers.findIndex(
        (h) => h.toLowerCase().trim() === columnName.toLowerCase().trim()
      );
      return index >= 0 && index < values.length ? values[index] || "" : "";
    } else {
      const index = parseInt(columnName);
      return !isNaN(index) && index >= 0 && index < values.length
        ? values[index] || ""
        : "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const parseCSV = useCallback(
    (csvFile: File) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter((line) => line.trim());
        const data: CSVProduct[] = [];

        const detectedHeaders =
          config.hasHeaders && lines.length > 0
            ? parseCSVLine(lines[0], config.delimiter)
            : [];

        setHeaders(detectedHeaders);

        const startIndex = config.hasHeaders ? 1 : 0;

        for (
          let i = startIndex;
          i < Math.min(lines.length, startIndex + 6);
          i++
        ) {
          if (!lines[i].trim()) continue;

          const values = parseCSVLine(lines[i], config.delimiter);

          const product: CSVProduct = {
            name: getValueByMapping("name", values, detectedHeaders, config),
            type:
              getValueByMapping("type", values, detectedHeaders, config) ||
              "producto",
            barcode: getValueByMapping(
              "barcode",
              values,
              detectedHeaders,
              config
            ),
            category: getValueByMapping(
              "category",
              values,
              detectedHeaders,
              config
            ),
            sku: getValueByMapping("sku", values, detectedHeaders, config),
            sellAtPOS: getValueByMapping(
              "sellAtPOS",
              values,
              detectedHeaders,
              config
            ),
            includeInCatalog: getValueByMapping(
              "includeInCatalog",
              values,
              detectedHeaders,
              config
            ),
            requirePrescription: getValueByMapping(
              "requirePrescription",
              values,
              detectedHeaders,
              config
            ),
            saleUnit: getValueByMapping(
              "saleUnit",
              values,
              detectedHeaders,
              config
            ),
            brand: getValueByMapping("brand", values, detectedHeaders, config),
            description: getValueByMapping(
              "description",
              values,
              detectedHeaders,
              config
            ),
            useStock: getValueByMapping(
              "useStock",
              values,
              detectedHeaders,
              config
            ),
            quantity: getValueByMapping(
              "quantity",
              values,
              detectedHeaders,
              config
            ),
            price: getValueByMapping("price", values, detectedHeaders, config),
            cost: getValueByMapping("cost", values, detectedHeaders, config),
            stock: getValueByMapping("stock", values, detectedHeaders, config),
            image: getValueByMapping("image", values, detectedHeaders, config),
            location: getValueByMapping(
              "location",
              values,
              detectedHeaders,
              config
            ),
            minimumQuantity: getValueByMapping(
              "minimumQuantity",
              values,
              detectedHeaders,
              config
            ),
            satKey: getValueByMapping(
              "satKey",
              values,
              detectedHeaders,
              config
            ),
            iva: getValueByMapping("iva", values, detectedHeaders, config),
            ieps: getValueByMapping("ieps", values, detectedHeaders, config),
            satUnitKey: getValueByMapping(
              "satUnitKey",
              values,
              detectedHeaders,
              config
            ),
            ivaIncluded: getValueByMapping(
              "ivaIncluded",
              values,
              detectedHeaders,
              config
            ),
          };

          data.push(product);
        }

        setPreviewData(data);
      };

      reader.readAsText(csvFile);
    },
    [config] // 👈 dependencia correcta
  );

  // Reprocesar cuando cambia la configuración
  useEffect(() => {
    if (file) {
      parseCSV(file);
    }
  }, [file, config, parseCSV]);

  const handleConfigChange = (
    key: keyof CSVImportConfig,
    value: string | boolean | FieldMapping
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleMappingChange = (field: keyof FieldMapping, value: string) => {
    setConfig((prev) => ({
      ...prev,
      mapping: { ...prev.mapping, [field]: value },
    }));
  };

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("config", JSON.stringify(config));

      const response = await fetch("/api/products/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error en la importación");
      }

      const resultData: ImportResult = await response.json();
      setResult(resultData);
    } catch (error: unknown) {
      console.error("Import error:", error);
      setResult({
        success: 0,
        errors: 1,
        details: [
          {
            row: 0,
            productName: "Error",
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Error al procesar el archivo",
          },
        ],
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Importar Productos desde CSV</h1>
        <button
          onClick={() => router.push("/dashboard/products")}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Volver a Productos
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Configuración de Importación
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Archivo CSV
            </label>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Delimitador
            </label>
            <select
              value={config.delimiter}
              onChange={(e) => handleConfigChange("delimiter", e.target.value)}
              className="border p-2 rounded w-full"
            >
              <option value=",">Coma (,)</option>
              <option value=";">Punto y coma (;)</option>
              <option value="\t">Tabulador</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasHeaders"
              checked={config.hasHeaders}
              onChange={(e) =>
                handleConfigChange("hasHeaders", e.target.checked)
              }
              className="mr-2"
            />
            <label htmlFor="hasHeaders" className="text-sm font-medium">
              El archivo tiene encabezados
            </label>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowMapping(!showMapping)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {showMapping ? "Ocultar mapeo de campos" : "Mostrar mapeo de campos"}
        </button>

        {showMapping && (
          <div className="mt-4 p-4 border rounded bg-gray-50">
            <h3 className="font-medium mb-3">Mapeo de Campos CSV</h3>
            <p className="text-sm text-gray-600 mb-3">
              {config.hasHeaders
                ? "Ingresa el nombre exacto del encabezado en tu CSV para cada campo"
                : "Ingresa el número de columna (comenzando desde 0) para cada campo"}
            </p>

            {config.hasHeaders && headers.length > 0 && (
              <div className="mb-4 p-2 bg-blue-50 rounded">
                <p className="text-sm font-medium">Encabezados detectados:</p>
                <p className="text-sm">{headers.join(", ")}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(config.mapping).map(([field, value]) => (
                <div key={field}>
                  <label className="block text-sm font-medium mb-1 capitalize">
                    {field.replace(/([A-Z])/g, " $1").toLowerCase()}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) =>
                      handleMappingChange(
                        field as keyof FieldMapping,
                        e.target.value
                      )
                    }
                    className="border p-2 rounded w-full text-sm"
                    placeholder={config.hasHeaders ? "nombre_header" : "0"}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {previewData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Vista Previa (primeras {previewData.length} filas)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border px-3 py-2 text-left">Nombre</th>
                  <th className="border px-3 py-2 text-left">Tipo</th>
                  <th className="border px-3 py-2 text-left">SKU</th>
                  <th className="border px-3 py-2 text-left">Precio</th>
                  <th className="border px-3 py-2 text-left">Stock</th>
                  <th className="border px-3 py-2 text-left">Categoría</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((product, index) => (
                  <tr key={index}>
                    <td className="border px-3 py-2">{product.name}</td>
                    <td className="border px-3 py-2">{product.type}</td>
                    <td className="border px-3 py-2">{product.sku || "-"}</td>
                    <td className="border px-3 py-2">{product.price || "0"}</td>
                    <td className="border px-3 py-2">{product.stock || "0"}</td>
                    <td className="border px-3 py-2">
                      {product.category || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {file && (
        <div className="flex justify-end">
          <button
            onClick={handleImport}
            disabled={isImporting}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isImporting ? "Importando..." : "Iniciar Importación"}
          </button>
        </div>
      )}

      {result && (
        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
          <h2 className="text-xl font-semibold mb-4">
            Resultado de la Importación
          </h2>
          <div className="mb-4">
            <p
              className={`text-lg font-medium ${result.errors > 0 ? "text-yellow-600" : "text-green-600"}`}
            >
              {result.success} productos importados correctamente,{" "}
              {result.errors} con errores
            </p>
          </div>

          {result.details.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border px-3 py-2 text-left">Fila</th>
                    <th className="border px-3 py-2 text-left">Producto</th>
                    <th className="border px-3 py-2 text-left">Estado</th>
                    <th className="border px-3 py-2 text-left">Mensaje</th>
                  </tr>
                </thead>
                <tbody>
                  {result.details.map((detail, index) => (
                    <tr
                      key={index}
                      className={
                        detail.status === "error" ? "bg-red-50" : "bg-green-50"
                      }
                    >
                      <td className="border px-3 py-2">{detail.row}</td>
                      <td className="border px-3 py-2">{detail.productName}</td>
                      <td className="border px-3 py-2 capitalize">
                        {detail.status}
                      </td>
                      <td className="border px-3 py-2">{detail.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
