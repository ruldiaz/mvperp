"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Grid,
  IconButton,
  Divider,
  CircularProgress,
  InputAdornment,
  Collapse,
  Paper,
} from "@mui/material";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Settings2,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  FileText,
  User,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";
import { Customer } from "@/types/customer";
import { toast } from "react-hot-toast";

const IVA_PERCENTAGE = 0.16;

type PricingMode = "manual" | "individual_margin" | "global_margin";
type TaxMode = "net" | "gross";

interface ExtendedQuotationItem {
  productId: string;
  quantity: number;
  cost: number;
  margin: number;
  taxMode: TaxMode;
  typedPrice: number;
  unitPrice: number;
  totalPrice: number;
  satProductKey?: string;
  satUnitKey?: string;
  description?: string;
  showDetails?: boolean;
}

interface QuotationFormProps {
  initialData?: {
    customerId: string;
    expiryDate?: string;
    notes?: string;
    quotationItems: any[];
  };
  onSubmit: (data: any) => Promise<void>;
  title: string;
  submitLabel: string;
  isSubmitting: boolean;
}

export default function QuotationForm({
  initialData,
  onSubmit,
  title,
  submitLabel,
  isSubmitting,
}: QuotationFormProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [selectedCustomer, setSelectedCustomer] = useState(initialData?.customerId || "");
  const [expiryDate, setExpiryDate] = useState(
    initialData?.expiryDate ? new Date(initialData.expiryDate).toISOString().split("T")[0] : ""
  );
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [items, setItems] = useState<ExtendedQuotationItem[]>([]);
  const [pricingMode, setPricingMode] = useState<PricingMode>("manual");
  const [globalMargin, setGlobalMargin] = useState<number>(0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const calculateItemMath = useCallback(
    (item: ExtendedQuotationItem, mode: PricingMode, gMargin: number): ExtendedQuotationItem => {
      let basePrice = 0;
      const actualCost = item.taxMode === "gross" ? item.cost / (1 + IVA_PERCENTAGE) : item.cost;

      if (mode === "manual") {
        basePrice = item.taxMode === "gross" ? item.typedPrice / (1 + IVA_PERCENTAGE) : item.typedPrice;
        if (actualCost > 0) {
          item.margin = ((basePrice - actualCost) / actualCost) * 100;
        }
      } else {
        const activeMargin = mode === "global_margin" ? gMargin : item.margin;
        basePrice = actualCost * (1 + activeMargin / 100);
        item.typedPrice = item.taxMode === "gross" ? basePrice * (1 + IVA_PERCENTAGE) : basePrice;
      }

      return {
        ...item,
        unitPrice: basePrice,
        totalPrice: basePrice * item.quantity,
      };
    },
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        const [productsRes, customersRes] = await Promise.all([
          fetch("/api/products", { credentials: "include" }),
          fetch("/api/customers", { credentials: "include" }),
        ]);

        if (!productsRes.ok || !customersRes.ok) throw new Error("Error loading data");

        const productsData = await productsRes.json();
        const customersData = await customersRes.json();

        setProducts(productsData.products || []);
        setCustomers(customersData.customers || []);

        if (initialData?.quotationItems) {
          setItems(
            initialData.quotationItems.map((item) => {
              const baseItem: ExtendedQuotationItem = {
                productId: item.productId,
                quantity: item.quantity,
                cost: item.product?.cost || 0,
                margin: 0,
                taxMode: "net",
                typedPrice: item.unitPrice,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                satProductKey: item.satProductKey || "",
                satUnitKey: item.satUnitKey || "",
                description: item.description || item.product?.name || "",
                showDetails: false,
              };
              return calculateItemMath(baseItem, "manual", 0);
            })
          );
        }
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar productos o clientes");
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, [initialData, calculateItemMath]);

  useEffect(() => {
    if (pricingMode === "global_margin") {
      setItems((prev) => prev.map((item) => calculateItemMath(item, pricingMode, globalMargin)));
    }
  }, [globalMargin, pricingMode, calculateItemMath]);

  const handleModeChange = (newMode: PricingMode) => {
    setPricingMode(newMode);
    setItems((prev) => prev.map((item) => calculateItemMath(item, newMode, globalMargin)));
  };

  const addItem = () => {
    const newItem: ExtendedQuotationItem = {
      productId: "",
      quantity: 1,
      cost: 0,
      margin: pricingMode === "global_margin" ? globalMargin : 0,
      taxMode: "net",
      typedPrice: 0,
      unitPrice: 0,
      totalPrice: 0,
      satProductKey: "",
      satUnitKey: "",
      description: "",
      showDetails: false,
    };
    setItems([...items, newItem]);
  };

  const updateItem = (index: number, field: keyof ExtendedQuotationItem, value: any) => {
    setItems((prev) => {
      const newItems = [...prev];
      const updatedItem = { ...newItems[index], [field]: value };
      newItems[index] = calculateItemMath(updatedItem, pricingMode, globalMargin);
      return newItems;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    setItems((prev) => {
      const newItems = [...prev];
      const currentItem = newItems[index];
      const updatedItem = {
        ...currentItem,
        productId,
        satProductKey: product?.satKey || "",
        satUnitKey: product?.satUnitKey || "",
        description: product?.name || "",
        cost: product?.cost || 0,
        typedPrice: product?.price || 0,
      };
      newItems[index] = calculateItemMath(updatedItem, pricingMode, globalMargin);
      return newItems;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return toast.error("Selecciona un cliente");
    if (items.length === 0) return toast.error("Agrega al menos un producto");
    if (items.some((i) => !i.productId)) return toast.error("Todos los productos deben estar seleccionados");

    const data = {
      customerId: selectedCustomer,
      expiryDate: expiryDate || undefined,
      quotationItems: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        satProductKey: item.satProductKey,
        satUnitKey: item.satUnitKey,
        description: item.description,
      })),
      notes,
    };
    onSubmit(data);
  };

  const totalWithoutIVA = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const iva = totalWithoutIVA * IVA_PERCENTAGE;
  const totalWithIVA = totalWithoutIVA + iva;

  if (isLoadingData) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress size={30} sx={{ color: '#64748b' }} />
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 1000, mx: "auto", py: 6, px: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 6 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em', mb: 1 }}>
            {title}
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.95rem' }}>
            Documento de cotización comercial
          </Typography>
        </Box>
        <Button
          variant="text"
          startIcon={<ArrowLeft size={18} strokeWidth={1.5} />}
          onClick={() => router.back()}
          sx={{ color: '#64748b', textTransform: 'none', fontWeight: 500, '&:hover': { bgcolor: '#f1f5f9' } }}
        >
          Regresar
        </Button>
      </Box>

      {/* Pricing Config - Neutral Gray Style */}
      <Paper variant="outlined" sx={{ mb: 6, p: 3, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 1 }}>
          <Settings2 size={16} strokeWidth={2} color="#64748b" />
          <Typography sx={{ color: '#475569', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Configuración de Precios
          </Typography>
        </Box>
        <Grid container spacing={4} alignItems="flex-end">
          <Grid size={{ xs: 12, md: 8 }}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Esquema de precios</InputLabel>
              <Select
                value={pricingMode}
                onChange={(e) => handleModeChange(e.target.value as PricingMode)}
                label="Esquema de precios"
                sx={{ bgcolor: 'white', borderRadius: 1.5 }}
              >
                <MenuItem value="manual">Manual: Ingreso directo de precios</MenuItem>
                <MenuItem value="individual_margin">Detallado: Basado en margen por item</MenuItem>
                <MenuItem value="global_margin">Global: Margen único para toda la lista</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {pricingMode === "global_margin" && (
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Margen Global %"
                type="number"
                value={globalMargin}
                onChange={(e) => setGlobalMargin(Number(e.target.value))}
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end"><Typography sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>%</Typography></InputAdornment>,
                  }
                }}
                sx={{ bgcolor: 'white', borderRadius: 1.5 }}
              />
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Main Fields */}
      <Grid container spacing={3} mb={6}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <User size={14} color="#64748b" />
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Cliente</Typography>
          </Box>
          <FormControl fullWidth variant="outlined" size="small">
            <Select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              required
              sx={{ borderRadius: 1.5 }}
            >
              <MenuItem value=""><em>Seleccione un cliente</em></MenuItem>
              {customers.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Calendar size={14} color="#64748b" />
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Vencimiento</Typography>
          </Box>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            slotProps={{
              inputLabel: { shrink: true }
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
          />
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FileText size={18} strokeWidth={1.5} color="#475569" />
          <Typography sx={{ fontWeight: 600, color: '#334155' }}>Líneas de Detalle</Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Plus size={16} strokeWidth={2} />}
          onClick={addItem}
          sx={{ borderRadius: 1.5, textTransform: 'none', color: '#475569', borderColor: '#cbd5e1', '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' } }}
        >
          Nuevo Item
        </Button>
      </Box>

      {items.length === 0 ? (
        <Paper variant="outlined" sx={{ py: 8, textAlign: "center", borderRadius: 2, borderStyle: "dashed", bgcolor: '#f8fafc', borderColor: '#e2e8f0' }}>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.9rem' }}>No hay productos agregados</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map((item, index) => (
            <Box key={index} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 2, position: 'relative', '&:hover': { borderColor: '#cbd5e1' } }}>
              <IconButton
                size="small"
                onClick={() => removeItem(index)}
                sx={{ position: "absolute", top: 8, right: 8, color: '#94a3b8', '&:hover': { color: '#ef4444', bgcolor: '#fef2f2' } }}
              >
                <X size={16} />
              </IconButton>
              
              <Grid container spacing={2} alignItems="flex-end">
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#94a3b8', fontWeight: 600 }}>PRODUCTO</Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={item.productId}
                      onChange={(e) => handleProductChange(index, e.target.value)}
                      sx={{ borderRadius: 1.5 }}
                    >
                      {products.map((p) => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 4, md: 1 }}>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#94a3b8', fontWeight: 600 }}>CANT</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                  />
                </Grid>
                <Grid size={{ xs: 8, md: 1.5 }}>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#94a3b8', fontWeight: 600 }}>IMPUESTO</Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={item.taxMode}
                    onChange={(e) => updateItem(index, "taxMode", e.target.value as TaxMode)}
                    sx={{ borderRadius: 1.5 }}
                  >
                    <MenuItem value="net">Neto</MenuItem>
                    <MenuItem value="gross">Bruto</MenuItem>
                  </Select>
                </Grid>
                {pricingMode !== "manual" && (
                  <Grid size={{ xs: 6, md: 1.5 }}>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#94a3b8', fontWeight: 600 }}>COSTO</Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={item.cost}
                      onChange={(e) => updateItem(index, "cost", Number(e.target.value))}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                    />
                  </Grid>
                )}
                {pricingMode === "individual_margin" && (
                  <Grid size={{ xs: 6, md: 1 }}>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#94a3b8', fontWeight: 600 }}>% MARGEN</Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={item.margin}
                      onChange={(e) => updateItem(index, "margin", Number(e.target.value))}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                    />
                  </Grid>
                )}
                <Grid size={{ xs: 12, md: 2 }}>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#94a3b8', fontWeight: 600 }}>PRECIO UNIT.</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    value={pricingMode === "manual" ? item.typedPrice : item.typedPrice.toFixed(2)}
                    onChange={(e) => pricingMode === "manual" && updateItem(index, "typedPrice", Number(e.target.value))}
                    slotProps={{ input: { readOnly: pricingMode !== "manual" } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: pricingMode !== 'manual' ? '#f8fafc' : 'white' } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 1 }} sx={{ textAlign: "right", pb: 1 }}>
                  <Typography sx={{ fontWeight: 700, color: '#1e293b' }}>{formatCurrency(item.totalPrice)}</Typography>
                </Grid>
              </Grid>

              <Box mt={2}>
                <Button
                  size="small"
                  variant="text"
                  startIcon={item.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  onClick={() => updateItem(index, "showDetails" as any, !item.showDetails)}
                  sx={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', p: 0, '&:hover': { bgcolor: 'transparent', color: '#334155' } }}
                >
                  Detalles Técnicos / SAT
                </Button>
                <Collapse in={item.showDetails}>
                  <Grid container spacing={2} mt={1}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField fullWidth size="small" label="Clave SAT" value={item.satProductKey} onChange={(e) => updateItem(index, "satProductKey", e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField fullWidth size="small" label="Unidad SAT" value={item.satUnitKey} onChange={(e) => updateItem(index, "satUnitKey", e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField fullWidth size="small" label="Descripción personalizada" value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }} />
                    </Grid>
                  </Grid>
                </Collapse>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <Box mt={6}>
        <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observaciones y Condiciones</Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Escriba aquí notas adicionales para el cliente..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Box>

      {/* Summary Section - Professional Style */}
      <Box mt={8} sx={{ p: 4, border: '1px solid #e2e8f0', borderRadius: 3, bgcolor: '#f8fafc' }}>
        <Grid container spacing={4} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box display="flex" justifyContent="space-between">
                <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>Subtotal Neto</Typography>
                <Typography sx={{ fontWeight: 500 }}>{formatCurrency(totalWithoutIVA)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>Impuestos (16%)</Typography>
                <Typography sx={{ fontWeight: 500 }}>{formatCurrency(iva)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography sx={{ color: '#1e293b', fontWeight: 700, fontSize: '1.1rem' }}>Total General</Typography>
                <Typography sx={{ color: '#0f172a', fontWeight: 800, fontSize: '1.25rem' }}>{formatCurrency(totalWithIVA)}</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: 'right' }}>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => router.back()}
                sx={{ borderRadius: 1.5, px: 4, py: 1.2, textTransform: 'none', borderColor: '#cbd5e1', color: '#475569' }}
              >
                Descartar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Save size={18} strokeWidth={1.5} />}
                sx={{ borderRadius: 1.5, px: 4, py: 1.2, textTransform: 'none', bgcolor: '#334155', '&:hover': { bgcolor: '#1e293b' }, boxShadow: 'none' }}
              >
                {isSubmitting ? "Guardando..." : submitLabel}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
