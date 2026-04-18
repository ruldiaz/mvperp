"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { FileText, Upload, Check, AlertCircle } from "lucide-react";
import { extractTextFromPdf, ExtractedItem } from "@/lib/pdf-parser";
import { Product } from "@/types/product";
import { ImportedItemData } from "@/types/import-types";

interface PdfImporterProps {
  onImport: (items: ImportedItemData[], newProduct?: Product) => void;
  products: Product[];
}

export default function PdfImporter({ onImport, products }: PdfImporterProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  /** Which numeric column index to use as cost (0-based within numericColumns) */
  const [priceColumnIndex, setPriceColumnIndex] = useState<number>(0);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const results = await extractTextFromPdf(file);
      if (results.length === 0) {
        setError("No se pudieron extraer datos del PDF. Verifique que el archivo tenga texto seleccionable. Revise la consola del navegador (F12) para más detalles.");
      } else {
        setExtracted(results);
        setSelectedIndices(results.map((_, i) => i));
        setPriceColumnIndex(0);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[PdfImporter] Error:", err);
      setError(`Error al procesar el PDF: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Determine how many numeric columns exist (use the max across all rows)
  const maxColumns = extracted.reduce((max, item) => Math.max(max, item.numericColumns.length), 0);

  const getColumnLabel = (colIndex: number, totalCols: number): string => {
    if (totalCols === 1) return "Precio";
    if (totalCols === 2) return colIndex === 0 ? "P. Unitario" : "Total";
    if (totalCols === 3) return colIndex === 0 ? "P. Unitario" : colIndex === 1 ? "Descuento/IVA" : "Total";
    return `Col ${colIndex + 1}`;
  };

  const ensureGenericProductObject = async (): Promise<Product | null> => {
    setLoading(true);
    try {
      const productData = {
        name: "Concepto Externo (PDF Import)",
        sku: "GENERIC-PDF",
        type: "servicio",
        useStock: false,
        category: "PDF-IMPORT",
        description: "Producto genérico utilizado para partidas importadas desde PDF que no existen en el catálogo.",
        satKey: "01010101",
        satUnitKey: "H87",
        includeInCatalog: false,
        sellAtPOS: false,
      };

      const formData = new FormData();
      formData.append("product", JSON.stringify(productData));

      const res = await fetch("/api/products", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Could not create generic product");
      const data = (await res.json()) as { product: Product };
      return data.product;
    } catch (err) {
      console.error("Error creating generic product:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    const selectedItems = extracted.filter((_, i) => selectedIndices.includes(i));
    
    // Ensure we have a generic product ID ready
    let genericProduct: Product | null = null;
    const existingGeneric = products.find(p => p.sku === "GENERIC-PDF" || p.name === "Concepto Externo (PDF Import)");
    
    let genericId = existingGeneric?.id || "";
    
    if (!genericId) {
      const created = await ensureGenericProductObject();
      if (created) {
        genericId = created.id!;
        genericProduct = created;
      }
    }

    if (!genericId && selectedItems.some(item => !products.some(p => p.name.toLowerCase().includes(item.description.toLowerCase())))) {
      setError("No se pudo encontrar ni crear el producto genérico necesario para las partidas sin match.");
      return;
    }

    const itemsToImport: ImportedItemData[] = selectedItems.map((ext) => {
      const matchedProduct = products.find(p => 
        p.name.toLowerCase().includes(ext.description.toLowerCase()) ||
        ext.description.toLowerCase().includes(p.name.toLowerCase())
      );

      // Use the user-selected column as cost
      const selectedCost = ext.numericColumns[priceColumnIndex] ?? ext.numericColumns[0] ?? 0;

      return {
        productId: matchedProduct?.id || genericId || "",
        description: ext.description,
        quantity: ext.quantity,
        unitPrice: 0,
        typedPrice: 0,
        totalPrice: 0,
        cost: selectedCost,
        margin: 0,
        satProductKey: matchedProduct?.satKey || "01010101",
        satUnitKey: matchedProduct?.satUnitKey || "H87",
        taxMode: "net" as const,
      };
    });

    onImport(itemsToImport, genericProduct || undefined);
    setOpen(false);
    setExtracted([]);
  };

  return (
    <>
      <Button
        variant="text"
        startIcon={<FileText size={18} />}
        onClick={() => setOpen(true)}
        sx={{ color: "#334155", textTransform: "none", fontWeight: 600 }}
      >
        Importar desde PDF
      </Button>

      <Dialog open={open} onClose={() => !loading && setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: "#1e293b" }}>
          Importar Cotización desde PDF
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>
            Extraiga automáticamente partidas, cantidades y precios de documentos digitales.
          </Typography>

          {extracted.length === 0 ? (
            <Box
              sx={{
                border: "2px dashed #e2e8f0",
                borderRadius: 2,
                p: 6,
                textAlign: "center",
                bgcolor: "#f8fafc",
                cursor: "pointer",
                "&:hover": { borderColor: "#cbd5e1", bgcolor: "#f1f5f9" },
              }}
              component="label"
            >
              <input type="file" hidden accept="application/pdf" onChange={handleFileChange} />
              {loading ? (
                <CircularProgress size={24} sx={{ color: "#64748b" }} />
              ) : (
                <>
                  <Upload size={32} color="#94a3b8" style={{ marginBottom: 12 }} />
                  <Typography sx={{ fontWeight: 600, color: "#475569" }}>
                    Seleccione un archivo PDF
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                    Solo PDFs con texto nativo (no escaneados)
                  </Typography>
                </>
              )}
            </Box>
          ) : (
            <Box>
              {/* Column Selector */}
              {maxColumns > 1 && (
                <Box sx={{ mb: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 1.5, border: "1px solid #e2e8f0" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", mb: 1, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    ¿Qué columna usar como costo?
                  </Typography>
                  <ToggleButtonGroup
                    value={priceColumnIndex}
                    exclusive
                    onChange={(_, val) => { if (val !== null) setPriceColumnIndex(val); }}
                    size="small"
                  >
                    {Array.from({ length: maxColumns }, (_, i) => (
                      <ToggleButton
                        key={i}
                        value={i}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          px: 2,
                          "&.Mui-selected": { bgcolor: "#334155", color: "#fff", "&:hover": { bgcolor: "#1e293b" } },
                        }}
                      >
                        {getColumnLabel(i, maxColumns)}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>
              )}

              <Typography variant="caption" sx={{ fontWeight: 700, color: "#94a3b8", mb: 1, display: "block" }}>
                ITEMS ENCONTRADOS ({extracted.length})
              </Typography>

              {/* Table header */}
              <Box sx={{ display: "flex", px: 2, py: 1, bgcolor: "#f1f5f9", borderRadius: "6px 6px 0 0", border: "1px solid #e2e8f0", borderBottom: "none" }}>
                <Box sx={{ width: 40 }} />
                <Typography variant="caption" sx={{ flex: 1, fontWeight: 700, color: "#64748b" }}>DESCRIPCIÓN</Typography>
                <Typography variant="caption" sx={{ width: 60, textAlign: "right", fontWeight: 700, color: "#64748b" }}>CANT</Typography>
                {Array.from({ length: maxColumns }, (_, i) => (
                  <Typography
                    key={i}
                    variant="caption"
                    sx={{
                      width: 100,
                      textAlign: "right",
                      fontWeight: 700,
                      color: i === priceColumnIndex ? "#166534" : "#64748b",
                      bgcolor: i === priceColumnIndex ? "#dcfce7" : "transparent",
                      borderRadius: 1,
                      px: 0.5,
                    }}
                  >
                    {getColumnLabel(i, maxColumns)}
                  </Typography>
                ))}
              </Box>

              {/* Item rows */}
              <List sx={{ maxHeight: 300, overflow: "auto", border: "1px solid #e2e8f0", borderRadius: "0 0 6px 6px" }}>
                {extracted.map((item, idx) => {
                  const hasMatch = products.some(p => 
                    p.name.toLowerCase().includes(item.description.toLowerCase()) ||
                    item.description.toLowerCase().includes(p.name.toLowerCase())
                  );

                  return (
                    <ListItem key={idx} dense sx={{ borderBottom: "1px solid #f1f5f9", py: 0.5, px: 1 }}>
                      <Checkbox
                        size="small"
                        checked={selectedIndices.includes(idx)}
                        onChange={() => handleToggle(idx)}
                      />
                      <Box sx={{ display: "flex", flex: 1, alignItems: "center" }}>
                        <Box sx={{ flex: 1, mr: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#1e293b" }}>
                              {item.description}
                            </Typography>
                            <Box
                              sx={{
                                fontSize: "9px",
                                px: 0.5,
                                borderRadius: 0.5,
                                fontWeight: 700,
                                bgcolor: hasMatch ? "#dcfce7" : "#f1f5f9",
                                color: hasMatch ? "#166534" : "#64748b",
                                border: `1px solid ${hasMatch ? "#bbf7d0" : "#e2e8f0"}`,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {hasMatch ? "MATCH" : "GENÉRICO"}
                            </Box>
                          </Box>
                        </Box>
                        <Typography sx={{ width: 60, textAlign: "right", fontSize: "0.8rem", color: "#475569" }}>
                          {item.quantity}
                        </Typography>
                        {item.numericColumns.map((val, colIdx) => (
                          <Typography
                            key={colIdx}
                            sx={{
                              width: 100,
                              textAlign: "right",
                              fontSize: "0.8rem",
                              fontWeight: colIdx === priceColumnIndex ? 700 : 400,
                              color: colIdx === priceColumnIndex ? "#166534" : "#64748b",
                              bgcolor: colIdx === priceColumnIndex ? "#f0fdf4" : "transparent",
                              borderRadius: 1,
                              px: 0.5,
                            }}
                          >
                            ${val.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </Typography>
                        ))}
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}

          {error && (
            <Alert severity="warning" icon={<AlertCircle size={18} />} sx={{ mt: 2, borderRadius: 1.5 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setOpen(false); setExtracted([]); }} sx={{ color: "#64748b", textTransform: "none" }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={selectedIndices.length === 0 || extracted.length === 0}
            onClick={handleConfirm}
            startIcon={<Check size={18} />}
            sx={{
              bgcolor: "#334155",
              "&:hover": { bgcolor: "#1e293b" },
              textTransform: "none",
              borderRadius: 1.5,
              px: 3,
            }}
          >
            Confirmar Importar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
