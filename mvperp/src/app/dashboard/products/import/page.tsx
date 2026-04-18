"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CSVProduct,
  ImportResult,
  CSVImportConfig,
  FieldMapping,
} from "@/types/product-import";
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell, Checkbox, FormControlLabel,
  TableContainer, TableHead, TableRow, Paper, Select, MenuItem, Divider, Stack, InputLabel, FormControl, CircularProgress, Grid
} from "@mui/material";
import { 
  ArrowLeft, UploadCloud, Settings, Eye, FileText, CheckCircle, AlertCircle, ChevronDown, ChevronUp
} from "lucide-react";

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

  const parseCSVLine = (line: string, delimiter: string): string[] => {
    if (delimiter === "\t") {
      return line.split("\t").map((field) => field.trim());
    }

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
        if (i + 1 < line.length && line[i + 1] === quoteChar) {
          currentField += char;
          i++; 
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

    result.push(currentField.trim());
    return result;
  };

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
            barcode: getValueByMapping("barcode", values, detectedHeaders, config),
            category: getValueByMapping("category", values, detectedHeaders, config),
            sku: getValueByMapping("sku", values, detectedHeaders, config),
            sellAtPOS: getValueByMapping("sellAtPOS", values, detectedHeaders, config),
            includeInCatalog: getValueByMapping("includeInCatalog", values, detectedHeaders, config),
            requirePrescription: getValueByMapping("requirePrescription", values, detectedHeaders, config),
            saleUnit: getValueByMapping("saleUnit", values, detectedHeaders, config),
            brand: getValueByMapping("brand", values, detectedHeaders, config),
            description: getValueByMapping("description", values, detectedHeaders, config),
            useStock: getValueByMapping("useStock", values, detectedHeaders, config),
            quantity: getValueByMapping("quantity", values, detectedHeaders, config),
            price: getValueByMapping("price", values, detectedHeaders, config),
            cost: getValueByMapping("cost", values, detectedHeaders, config),
            stock: getValueByMapping("stock", values, detectedHeaders, config),
            image: getValueByMapping("image", values, detectedHeaders, config),
            location: getValueByMapping("location", values, detectedHeaders, config),
            minimumQuantity: getValueByMapping("minimumQuantity", values, detectedHeaders, config),
            satKey: getValueByMapping("satKey", values, detectedHeaders, config),
            iva: getValueByMapping("iva", values, detectedHeaders, config),
            ieps: getValueByMapping("ieps", values, detectedHeaders, config),
            satUnitKey: getValueByMapping("satUnitKey", values, detectedHeaders, config),
            ivaIncluded: getValueByMapping("ivaIncluded", values, detectedHeaders, config),
          };

          data.push(product);
        }

        setPreviewData(data);
      };

      reader.readAsText(csvFile);
    },
    [config] 
  );

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
    <Box sx={{ maxWidth: 1000, mx: "auto", py: 6, px: 3, animation: "fadeIn 0.3s ease" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 6, flexWrap: "wrap", gap: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em', mb: 1 }}>
            Importar Productos desde CSV
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.95rem' }}>
            Sube un archivo delimitado por comas para importar productos en lote
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => router.push("/dashboard/products")}
          startIcon={<ArrowLeft size={18} />}
          sx={{ borderRadius: 1.5, textTransform: 'none', px: 3, py: 1.2, borderColor: '#e2e8f0', color: '#475569', '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' } }}
        >
          Volver a Productos
        </Button>
      </Box>

      <Stack spacing={4}>
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: '#e0f2fe', color: '#0284c7' }}>
              <Settings size={24} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Configuración de Importación</Typography>
          </Box>
          
          <Grid container spacing={4} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" sx={{ color: '#475569', mb: 1 }}>Archivo CSV</Typography>
              <Button component="label" variant="outlined" fullWidth startIcon={<FileText size={18} />} sx={{ borderRadius: 1.5, py: 1.5, textTransform: 'none', borderColor: '#cbd5e1', color: file ? '#0f172a' : '#64748b' }}>
                {file ? file.name : "Seleccionar Archivo"}
                <input
                  type="file"
                  hidden
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                />
              </Button>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" sx={{ color: '#475569', mb: 1 }}>Delimitador</Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={config.delimiter}
                  onChange={(e) => handleConfigChange("delimiter", e.target.value)}
                  sx={{ borderRadius: 1.5, py: 0.5 }}
                >
                  <MenuItem value=",">Coma (,)</MenuItem>
                  <MenuItem value=";">Punto y coma (;)</MenuItem>
                  <MenuItem value="\t">Tabulador</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ mt: 1.5 }}>
                <FormControlLabel
                  control={<Checkbox size="small" checked={config.hasHeaders} onChange={(e) => handleConfigChange("hasHeaders", e.target.checked)} sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#334155' } }} />}
                  label={<Typography variant="body2" sx={{ color: '#475569' }}>El archivo tiene encabezados</Typography>}
                />
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Button
            variant="text"
            onClick={() => setShowMapping(!showMapping)}
            endIcon={showMapping ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#3b82f6' }}
          >
            {showMapping ? "Ocultar mapeo de campos" : "Mostrar mapeo de campos"}
          </Button>

          {showMapping && (
            <Box sx={{ mt: 3, p: 3, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#1e293b' }}>Mapeo de Campos CSV</Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                {config.hasHeaders
                  ? "Ingresa el nombre exacto del encabezado en tu CSV para cada campo."
                  : "Ingresa el número de columna (comenzando desde 0) para cada campo."}
              </Typography>

              {config.hasHeaders && headers.length > 0 && (
                <Box sx={{ mb: 4, p: 2, bgcolor: '#eff6ff', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e40af', display: 'block', mb: 0.5 }}>Encabezados detectados:</Typography>
                  <Typography variant="body2" sx={{ color: '#1e3a8a' }}>{headers.join(", ")}</Typography>
                </Box>
              )}

              <Grid container spacing={2}>
                {Object.entries(config.mapping).map(([field, value]) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={field}>
                    <TextField
                      fullWidth size="small" 
                      label={field.replace(/([A-Z])/g, " $1").charAt(0).toUpperCase() + field.replace(/([A-Z])/g, " $1").slice(1).toLowerCase()} 
                      value={value}
                      onChange={(e) => handleMappingChange(field as keyof FieldMapping, e.target.value)}
                      placeholder={config.hasHeaders ? "nombre_header" : "0"}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5, bgcolor: 'white' } }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Paper>

        {previewData.length > 0 && (
          <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: '#f3e8ff', color: '#9333ea' }}>
                <Eye size={24} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Vista Previa (primeras {previewData.length} filas)</Typography>
            </Box>
            
            <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Nombre</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>SKU</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Precio</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Stock</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Categoría</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.map((product, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.type}</TableCell>
                      <TableCell>{product.sku || "-"}</TableCell>
                      <TableCell>{product.price || "0"}</TableCell>
                      <TableCell>{product.stock || "0"}</TableCell>
                      <TableCell>{product.category || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {file && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              onClick={handleImport}
              disabled={isImporting}
              variant="contained"
              startIcon={isImporting ? <CircularProgress size={18} color="inherit" /> : <UploadCloud size={18} />}
              sx={{ px: 4, py: 1.5, borderRadius: 1.5, bgcolor: '#334155', '&:hover': { bgcolor: '#1e293b' }, textTransform: 'none', boxShadow: 'none' }}
            >
              {isImporting ? "Importando..." : "Iniciar Importación"}
            </Button>
          </Box>
        )}

        {result && (
          <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0', bgcolor: result.errors > 0 ? '#fffbeb' : '#f0fdf4' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: result.errors > 0 ? '#fef3c7' : '#dcfce7', color: result.errors > 0 ? '#d97706' : '#16a34a' }}>
                {result.errors > 0 ? <AlertCircle size={24} /> : <CheckCircle size={24} />}
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                Resultado de la Importación
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 600, color: result.errors > 0 ? '#b45309' : '#15803d', mb: 3 }}>
              {result.success} productos importados correctamente, {result.errors} con errores
            </Typography>

            {result.details.length > 0 && (
              <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: 'white' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Fila</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Producto</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Estado</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Mensaje</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.details.map((detail, index) => (
                      <TableRow key={index} sx={{ bgcolor: detail.status === 'error' ? '#fef2f2' : '#f0fdf4' }}>
                        <TableCell>{detail.row}</TableCell>
                        <TableCell>{detail.productName}</TableCell>
                        <TableCell sx={{ textTransform: 'capitalize', fontWeight: 600, color: detail.status === 'error' ? '#ef4444' : '#22c55e' }}>{detail.status}</TableCell>
                        <TableCell>{detail.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
