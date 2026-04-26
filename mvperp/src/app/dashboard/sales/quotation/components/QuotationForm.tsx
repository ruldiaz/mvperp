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
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Product, QuotationItem } from "@/types/product";
import { Customer } from "@/types/customer";
import { toast } from "react-hot-toast";
import PdfImporter from "./PdfImporter";
import { ImportedItemData } from "@/types/import-types";

const IVA_PERCENTAGE = 0.16;

/** Compact mobile input overrides */
const mobileInput = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 1.5,
  },
  '@media (max-width: 600px)': {
    '& .MuiOutlinedInput-root': {
      fontSize: '0.8rem',
    },
    '& .MuiOutlinedInput-input': {
      py: '6px',
      px: '10px',
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.75rem',
    },
    '& .MuiSelect-select': {
      py: '6px !important',
      px: '10px !important',
      fontSize: '0.8rem',
    },
  },
};

const mobileSelect = {
  borderRadius: 1.5,
  '@media (max-width: 600px)': {
    fontSize: '0.8rem',
    '& .MuiSelect-select': {
      py: '6px !important',
      px: '10px !important',
    },
  },
};

const mobileLabel = {
  display: 'block',
  mb: 0.5,
  color: '#94a3b8',
  fontWeight: 600,
  fontSize: { xs: '0.6rem', md: '0.75rem' },
};

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
    quotationItems: QuotationItem[];
  };
  onSubmit: (data: {
    customerId: string;
    expiryDate?: string;
    quotationItems: Array<Partial<QuotationItem> & Pick<QuotationItem, 'productId' | 'quantity' | 'unitPrice'>>;
    notes: string;
  }) => Promise<void>;
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

  // --- New Client Modal State ---
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState({ name: "", email: "", phone: "", rfc: "" });
  const [isCreatingClient, setIsCreatingClient] = useState(false);

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

  const updateItem = <T extends keyof ExtendedQuotationItem>(
    index: number,
    field: T,
    value: ExtendedQuotationItem[T]
  ) => {
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

  const handleImportPdf = (importedItems: ImportedItemData[], newProduct?: Product) => {
    if (newProduct) {
      setProducts(prev => [newProduct, ...prev]);
    }
    setItems((prev) => [
      ...prev,
      ...importedItems.map((item) => ({
        ...item,
        margin: pricingMode === "global_margin" ? globalMargin : item.margin,
        showDetails: false,
      })),
    ].map(item => calculateItemMath(item, pricingMode, globalMargin)));
    toast.success(`${importedItems.length} partidas importadas correctamente`);
  };

  // --- New Client Modal Handlers ---
  const handleOpenNewClient = () => {
    setNewClientData({ name: "", email: "", phone: "", rfc: "" });
    setShowNewClientModal(true);
  };

  const handleCloseNewClient = () => {
    setShowNewClientModal(false);
  };

  const handleSaveNewClient = async () => {
    if (!newClientData.name.trim()) {
      toast.error("El nombre del cliente es obligatorio");
      return;
    }
    setIsCreatingClient(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newClientData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al crear cliente");
      }
      const data = await res.json();
      const created: Customer = data.customer;
      setCustomers((prev) => [...prev, created]);
      setSelectedCustomer(created.id || "");
      toast.success(`Cliente "${created.name}" creado exitosamente`);
      setShowNewClientModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(msg);
    } finally {
      setIsCreatingClient(false);
    }
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
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 1000, mx: "auto", py: { xs: 1.5, md: 6 }, px: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ display: "flex", flexDirection: { xs: 'column', sm: 'row' }, justifyContent: "space-between", alignItems: { xs: 'flex-start', sm: 'flex-start' }, mb: { xs: 2, md: 6 }, gap: 0.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em', mb: 0.5, fontSize: { xs: '1.1rem', sm: '1.4rem', md: '2rem' } }}>
            {title}
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: { xs: '0.75rem', md: '0.9rem' } }}>
            Documento de cotización comercial
          </Typography>
        </Box>
        <Button
          variant="text"
          startIcon={<ArrowLeft size={16} strokeWidth={1.5} />}
          onClick={() => router.back()}
          sx={{ color: '#64748b', textTransform: 'none', fontWeight: 500, fontSize: { xs: '0.75rem', md: '0.875rem' }, '&:hover': { bgcolor: '#f1f5f9' }, p: { xs: 0, sm: 1 }, minWidth: 0 }}
        >
          Regresar
        </Button>
      </Box>


      {/* Pricing Config - Neutral Gray Style */}
      <Paper variant="outlined" sx={{ mb: { xs: 2, md: 6 }, p: { xs: 1.5, md: 3 }, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: { xs: 1.5, md: 3 }, gap: 1 }}>
          <Settings2 size={14} strokeWidth={2} color="#64748b" />
          <Typography sx={{ color: '#475569', fontWeight: 600, fontSize: { xs: '0.65rem', md: '0.75rem' }, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Configuración de Precios
          </Typography>
        </Box>
        <Grid container spacing={{ xs: 1.5, md: 4 }} sx={{ alignItems: 'flex-end' }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel sx={{ color: '#94a3b8', '@media (max-width: 600px)': { fontSize: '0.75rem' } }}>Esquema de precios</InputLabel>
              <Select
                value={pricingMode}
                onChange={(e) => handleModeChange(e.target.value as PricingMode)}
                label="Esquema de precios"
                sx={{ bgcolor: 'white', ...mobileSelect }}
              >
                <MenuItem value="manual" sx={{ '@media (max-width: 600px)': { fontSize: '0.8rem', minHeight: 32 } }}>Manual: Precios directos</MenuItem>
                <MenuItem value="individual_margin" sx={{ '@media (max-width: 600px)': { fontSize: '0.8rem', minHeight: 32 } }}>Detallado: Margen por item</MenuItem>
                <MenuItem value="global_margin" sx={{ '@media (max-width: 600px)': { fontSize: '0.8rem', minHeight: 32 } }}>Global: Margen único</MenuItem>
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
                sx={{ bgcolor: 'white', ...mobileInput }}
              />
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Main Fields */}
      <Grid container spacing={{ xs: 1, md: 3 }} sx={{ mb: { xs: 2, md: 6 } }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
            <User size={12} color="#64748b" />
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: { xs: '0.6rem', md: '0.75rem' } }}>Cliente</Typography>
          </Box>
          <FormControl fullWidth variant="outlined" size="small">
            <Select
              value={selectedCustomer}
              onChange={(e) => {
                if (e.target.value === "__new_client__") {
                  handleOpenNewClient();
                  return;
                }
                setSelectedCustomer(e.target.value);
              }}
              required
              sx={mobileSelect}
            >
              <MenuItem value=""><em>Seleccione un cliente</em></MenuItem>
              {customers.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
              <Divider />
              <MenuItem value="__new_client__" sx={{ color: '#2563eb', fontWeight: 600, gap: 1 }}>
                <UserPlus size={14} /> Agregar Nuevo Cliente
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
            <Calendar size={12} color="#64748b" />
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: { xs: '0.6rem', md: '0.75rem' } }}>Vencimiento</Typography>
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
            sx={mobileInput}
          />
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", flexDirection: { xs: 'column', sm: 'row' }, justifyContent: "space-between", alignItems: { xs: 'stretch', sm: 'center' }, mb: { xs: 1.5, md: 3 }, gap: { xs: 1, sm: 0 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <FileText size={14} strokeWidth={1.5} color="#475569" />
          <Typography sx={{ fontWeight: 600, color: '#334155', fontSize: { xs: '0.8rem', md: '1rem' } }}>Líneas de Detalle</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <PdfImporter onImport={handleImportPdf} products={products} />
          <Button
            variant="outlined"
            startIcon={<Plus size={14} strokeWidth={2} />}
            onClick={addItem}
            sx={{ borderRadius: 1.5, textTransform: 'none', color: '#475569', borderColor: '#cbd5e1', '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' }, flex: { xs: 1, sm: 'none' }, fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 0.5, md: 1 } }}
          >
            Nuevo Item
          </Button>
        </Box>
      </Box>

      {items.length === 0 ? (
        <Paper variant="outlined" sx={{ py: { xs: 4, md: 8 }, textAlign: "center", borderRadius: 2, borderStyle: "dashed", bgcolor: '#f8fafc', borderColor: '#e2e8f0' }}>
          <Typography sx={{ color: '#94a3b8', fontSize: { xs: '0.8rem', md: '0.9rem' } }}>No hay productos agregados</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, md: 2 } }}>
          {items.map((item, index) => (
            <Box key={index} sx={{ p: { xs: 1.5, md: 3 }, border: '1px solid #e2e8f0', borderRadius: { xs: 1.5, md: 2 }, position: 'relative', '&:hover': { borderColor: '#cbd5e1' } }}>
              <IconButton
                size="small"
                onClick={() => removeItem(index)}
                sx={{ position: "absolute", top: 4, right: 4, color: '#94a3b8', '&:hover': { color: '#ef4444', bgcolor: '#fef2f2' }, p: { xs: 0.3, md: 0.5 } }}
              >
                <X size={14} />
              </IconButton>
              
              <Grid container spacing={{ xs: 1, md: 2 }} sx={{ alignItems: 'flex-end' }}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" sx={mobileLabel}>PRODUCTO</Typography>
                  <FormControl fullWidth size="small">
                    <Autocomplete
                      size="small"
                      options={products}
                      getOptionLabel={(option) => option.name}
                      value={products.find((p) => p.id === item.productId) || null}
                      onChange={(event, newValue) => {
                        handleProductChange(index, newValue?.id || "");
                      }}
                      noOptionsText="No se encontraron productos"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Buscar producto..."
                          sx={{
                            ...mobileInput,
                            '& .MuiOutlinedInput-root': {
                              ...mobileInput['& .MuiOutlinedInput-root'],
                              padding: '2px 8px',
                            },
                            '@media (max-width: 600px)': {
                              ...mobileInput['@media (max-width: 600px)'],
                              '& .MuiOutlinedInput-root': {
                                ...mobileInput['@media (max-width: 600px)']['& .MuiOutlinedInput-root'],
                                padding: '1px 6px',
                              }
                            }
                          }}
                        />
                      )}
                    />
                  </FormControl>
                  {item.description && item.description !== products.find(p => p.id === item.productId)?.name && (
                    <Typography variant="caption" sx={{ color: '#10b981', mt: 0.3, display: 'block', fontWeight: 500, fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
                      {item.description}
                    </Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 4, md: 1 }}>
                  <Typography variant="caption" sx={mobileLabel}>CANT</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                    sx={mobileInput}
                  />
                </Grid>
                <Grid size={{ xs: 4, md: 1.5 }}>
                  <Typography variant="caption" sx={mobileLabel}>IMP.</Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={item.taxMode}
                    onChange={(e) => updateItem(index, "taxMode", e.target.value as TaxMode)}
                    sx={mobileSelect}
                  >
                    <MenuItem value="net">Neto</MenuItem>
                    <MenuItem value="gross">Bruto</MenuItem>
                  </Select>
                </Grid>
                {pricingMode !== "manual" && (
                  <Grid size={{ xs: 4, md: 1.5 }}>
                    <Typography variant="caption" sx={mobileLabel}>COSTO</Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={item.cost}
                      onChange={(e) => updateItem(index, "cost", Number(e.target.value))}
                      sx={mobileInput}
                    />
                  </Grid>
                )}
                {pricingMode === "individual_margin" && (
                  <Grid size={{ xs: 4, md: 1 }}>
                    <Typography variant="caption" sx={mobileLabel}>%MRG</Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={item.margin}
                      onChange={(e) => updateItem(index, "margin", Number(e.target.value))}
                      sx={mobileInput}
                    />
                  </Grid>
                )}
                <Grid size={{ xs: 4, md: 2 }}>
                  <Typography variant="caption" sx={mobileLabel}>P.UNIT</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    value={pricingMode === "manual" ? item.typedPrice : item.typedPrice.toFixed(2)}
                    onChange={(e) => pricingMode === "manual" && updateItem(index, "typedPrice", Number(e.target.value))}
                    slotProps={{ input: { readOnly: pricingMode !== "manual" } }}
                    sx={{ ...mobileInput, '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: pricingMode !== 'manual' ? '#f8fafc' : 'white' } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 1 }} sx={{ textAlign: "right", pb: { xs: 0, md: 1 } }}>
                  <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: { xs: '0.85rem', md: '1rem' } }}>{formatCurrency(item.totalPrice)}</Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: { xs: 1, md: 2 } }}>
                <Button
                  size="small"
                  variant="text"
                  startIcon={item.showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  onClick={() => updateItem(index, "showDetails", !item.showDetails)}
                  sx={{ color: '#64748b', fontSize: { xs: '0.6rem', md: '0.7rem' }, fontWeight: 600, textTransform: 'uppercase', p: 0, '&:hover': { bgcolor: 'transparent', color: '#334155' } }}
                >
                  Detalles SAT
                </Button>
                <Collapse in={item.showDetails}>
                  <Grid container spacing={{ xs: 1, md: 2 }} sx={{ mt: 0.5 }}>
                    <Grid size={{ xs: 6, md: 4 }}>
                      <TextField fullWidth size="small" label="Clave SAT" value={item.satProductKey} onChange={(e) => updateItem(index, "satProductKey", e.target.value)} sx={mobileInput} />
                    </Grid>
                    <Grid size={{ xs: 6, md: 4 }}>
                      <TextField fullWidth size="small" label="Unidad SAT" value={item.satUnitKey} onChange={(e) => updateItem(index, "satUnitKey", e.target.value)} sx={mobileInput} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField fullWidth size="small" label="Descripción" value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} sx={mobileInput} />
                    </Grid>
                  </Grid>
                </Collapse>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ mt: { xs: 3, md: 6 } }}>
        <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: { xs: '0.6rem', md: '0.75rem' } }}>Observaciones y Condiciones</Typography>
        <TextField
          fullWidth
          multiline
          rows={2}
          placeholder="Notas adicionales para el cliente..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{ ...mobileInput, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Box>

      {/* Summary Section - Professional Style */}
      <Box sx={{ mt: { xs: 2.5, md: 8 }, p: { xs: 1.5, md: 4 }, border: '1px solid #e2e8f0', borderRadius: { xs: 2, md: 3 }, bgcolor: '#f8fafc' }}>
        <Grid container spacing={{ xs: 1.5, md: 4 }} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: '#64748b', fontSize: { xs: '0.75rem', md: '0.9rem' } }}>Subtotal Neto</Typography>
                <Typography sx={{ fontWeight: 500, fontSize: { xs: '0.8rem', md: '1rem' } }}>{formatCurrency(totalWithoutIVA)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: '#64748b', fontSize: { xs: '0.75rem', md: '0.9rem' } }}>IVA (16%)</Typography>
                <Typography sx={{ fontWeight: 500, fontSize: { xs: '0.8rem', md: '1rem' } }}>{formatCurrency(iva)}</Typography>
              </Box>
              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: '#1e293b', fontWeight: 700, fontSize: { xs: '0.85rem', md: '1.1rem' } }}>Total</Typography>
                <Typography sx={{ color: '#0f172a', fontWeight: 800, fontSize: { xs: '0.95rem', md: '1.25rem' } }}>{formatCurrency(totalWithIVA)}</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: { xs: 'center', md: 'right' } }}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' }, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button
                variant="outlined"
                onClick={() => router.back()}
                sx={{ borderRadius: 1.5, px: { xs: 2, md: 4 }, py: { xs: 0.8, md: 1.2 }, textTransform: 'none', borderColor: '#cbd5e1', color: '#475569', fontSize: { xs: '0.8rem', md: '0.875rem' } }}
              >
                Descartar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={14} color="inherit" /> : <Save size={16} strokeWidth={1.5} />}
                sx={{ borderRadius: 1.5, px: { xs: 2, md: 4 }, py: { xs: 0.8, md: 1.2 }, textTransform: 'none', bgcolor: '#334155', '&:hover': { bgcolor: '#1e293b' }, boxShadow: 'none', fontSize: { xs: '0.8rem', md: '0.875rem' } }}
              >
                {isSubmitting ? "Guardando..." : submitLabel}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
      {/* ===== New Client Modal ===== */}
      <Dialog
        open={showNewClientModal}
        onClose={handleCloseNewClient}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2.5, p: 0.5 } } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, fontSize: '1.1rem', color: '#1e293b', pb: 1 }}>
          <UserPlus size={20} color="#2563eb" />
          Nuevo Cliente
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <TextField
            label="Nombre *"
            fullWidth
            size="small"
            value={newClientData.name}
            onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
            autoFocus
            sx={mobileInput}
          />
          <TextField
            label="Email"
            fullWidth
            size="small"
            type="email"
            value={newClientData.email}
            onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
            sx={mobileInput}
          />
          <TextField
            label="Teléfono"
            fullWidth
            size="small"
            value={newClientData.phone}
            onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
            sx={mobileInput}
          />
          <TextField
            label="RFC"
            fullWidth
            size="small"
            value={newClientData.rfc}
            onChange={(e) => setNewClientData({ ...newClientData, rfc: e.target.value.toUpperCase() })}
            sx={mobileInput}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={handleCloseNewClient}
            sx={{ textTransform: 'none', color: '#64748b', fontWeight: 500 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveNewClient}
            variant="contained"
            disabled={isCreatingClient || !newClientData.name.trim()}
            startIcon={isCreatingClient ? <CircularProgress size={14} color="inherit" /> : <Save size={16} />}
            sx={{ textTransform: 'none', bgcolor: '#334155', '&:hover': { bgcolor: '#1e293b' }, boxShadow: 'none', borderRadius: 1.5, px: 3 }}
          >
            {isCreatingClient ? "Guardando..." : "Crear Cliente"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
