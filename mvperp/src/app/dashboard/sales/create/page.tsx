// src/app/dashboard/sales/create/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Product } from "@/types/product";
import { Customer } from "@/types/customer";
import { toast } from "react-hot-toast";
import { 
  Box, Typography, Paper, Grid, Stack, Button, IconButton, TextField, 
  Select, MenuItem, FormControl, InputLabel, CircularProgress, Alert, 
  Tooltip, InputAdornment, Divider, useTheme, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Collapse
} from "@mui/material";
import { 
  ArrowLeft, Plus, Trash2, Save, ShoppingBag, User, Settings2, 
  Package, DollarSign, FileText, AlertTriangle, Search, X, ChevronDown, ChevronUp
} from "lucide-react";

const IVA_PERCENTAGE = 0.16;

type PricingMode = "manual" | "individual_margin" | "global_margin";
type TaxMode = "net" | "gross"; // net = Sin IVA, gross = Con IVA

interface ExtendedSaleItem {
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

export default function CreateSale() {
  const router = useRouter();
  const theme = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Form State
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ExtendedSaleItem[]>([]);
  
  // Pricing Mode State
  const [pricingMode, setPricingMode] = useState<PricingMode>("manual");
  const [globalMargin, setGlobalMargin] = useState<number>(0);

  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  // Derived Totals
  const totalAmountWithoutIVA = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const ivaAmount = totalAmountWithoutIVA * IVA_PERCENTAGE;
  const totalAmountWithIVA = totalAmountWithoutIVA * (1 + IVA_PERCENTAGE);
  const totalItemsCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const selectedCustomerData = customers.find((c) => c.id === selectedCustomer);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [productsRes, customersRes] = await Promise.all([
          fetch("/api/products", { credentials: "include" }),
          fetch("/api/customers", { credentials: "include" }),
        ]);

        if (!productsRes.ok) throw new Error(`Error productos: ${productsRes.status}`);
        if (!customersRes.ok) throw new Error(`Error clientes: ${customersRes.status}`);

        const productsData = await productsRes.json();
        const customersData = await customersRes.json();

        setProducts(productsData.products || []);
        setCustomers(customersData.customers || []);
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError("Error al cargar los datos necesarios");
        toast.error("Error al cargar datos");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.rfc?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.sku?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const calculateItemMath = useCallback((item: ExtendedSaleItem, mode: PricingMode, gMargin: number): ExtendedSaleItem => {
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
  }, []);

  useEffect(() => {
    if (pricingMode === "global_margin") {
      setItems((prevItems) =>
        prevItems.map((item) => calculateItemMath(item, pricingMode, globalMargin))
      );
    }
  }, [globalMargin, pricingMode, calculateItemMath]);

  const handleModeChange = (newMode: PricingMode) => {
    setPricingMode(newMode);
    setItems((prevItems) =>
      prevItems.map((item) => calculateItemMath(item, newMode, globalMargin))
    );
  };

  const addItem = () => {
    if (items.length >= 10) {
      toast.error("Máximo 10 productos por venta");
      return;
    }

    const newItem: ExtendedSaleItem = {
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
      showDetails: false
    };
    setItems([...items, newItem]);
  };

  const updateItem = (index: number, field: keyof ExtendedSaleItem, value: any) => {
    setItems((prevItems) => {
      const newItems = [...prevItems];
      const updatedItem = { ...newItems[index], [field]: value };
      newItems[index] = calculateItemMath(updatedItem, pricingMode, globalMargin);
      return newItems;
    });
  };

  const removeItem = (index: number) => {
    setItems((prevItems) => prevItems.filter((_, i) => i !== index));
    toast.success("Producto eliminado");
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    const dbPrice = product?.price || 0;
    const dbCost = product?.cost || 0;

    if (product?.stock === 0) {
      toast.error(`El producto ${product.name} no tiene existencias`);
      return;
    }

    setItems((prevItems) => {
      const newItems = [...prevItems];
      const currentItem = newItems[index];
      const updatedItem = {
        ...currentItem,
        productId,
        satProductKey: product?.satKey || "",
        satUnitKey: product?.satUnitKey || "",
        description: product?.name || "",
        cost: dbCost, 
        typedPrice: dbPrice,
      };
      newItems[index] = calculateItemMath(updatedItem, pricingMode, globalMargin);
      return newItems;
    });

    if (product) {
      toast.success(`${product.name} agregado`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer) {
      setError("Selecciona un cliente");
      toast.error("Selecciona un cliente");
      return;
    }

    if (items.length === 0) {
      setError("Agrega al menos un producto");
      toast.error("Agrega al menos un producto");
      return;
    }

    const hasEmptyProducts = items.some((item) => !item.productId);
    if (hasEmptyProducts) {
      setError("Todos los productos deben estar seleccionados");
      toast.error("Selecciona todos los productos");
      return;
    }

    // Validar stock
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (product && product.stock !== undefined && product.stock < item.quantity) {
        toast.error(`Stock insuficiente para ${product.name}. Stock disponible: ${product.stock}`);
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const saleData = {
        customerId: selectedCustomer,
        saleItems: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice, 
          satProductKey: item.satProductKey,
          satUnitKey: item.satUnitKey,
          description: item.description,
        })),
        notes,
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
        credentials: "include",
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || "Error al crear la venta");

      toast.success("¡Venta creada exitosamente!");
      setTimeout(() => { router.push("/dashboard/sales"); }, 1500);
    } catch (err) {
      console.error("Error creando venta:", err);
      const errorMessage = err instanceof Error ? err.message : "Error al crear la venta";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={40} sx={{ color: '#334155' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", py: 6, px: 3, animation: 'fadeIn 0.3s ease' }}>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 6, flexWrap: "wrap", gap: 3 }}>
        <Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
            <IconButton onClick={() => router.back()} size="small" sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
              <ArrowLeft size={18} />
            </IconButton>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em' }}>
              Nueva Venta
            </Typography>
          </Stack>
          <Typography sx={{ color: '#64748b', fontSize: '0.95rem', ml: 4 }}>
            Registra una nueva transacción de venta
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={() => router.back()}
            sx={{ 
              height: 42,
              borderRadius: 1.5, 
              padding: '9px 24px', 
              borderColor: '#cbd5e1', 
              color: '#475569', 
              textTransform: 'none', 
              fontWeight: 600
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || items.length === 0 || !selectedCustomer}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save size={18} strokeWidth={1.5} />}
            sx={{ 
              height: 42,
              borderRadius: 1.5, 
              padding: '9px 24px', 
              bgcolor: '#334155', 
              '&:hover': { bgcolor: '#1e293b' }, 
              textTransform: 'none', 
              boxShadow: 'none', 
              fontWeight: 600
            }}
          >
            {loading ? "Guardando..." : "Finalizar Venta"}
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" icon={<AlertTriangle size={18} color="#64748b" />} sx={{ mb: 4, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Configuration & Customer Selection Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Pricing Config */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, height: '100%', borderColor: '#e2e8f0', bgcolor: '#f8fafc' }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2.5, gap: 1 }}>
              <Settings2 size={18} strokeWidth={1.5} color="#64748b" />
              <Typography sx={{ color: '#475569', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Esquema de Precios
              </Typography>
            </Box>
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <Select
                  value={pricingMode}
                  onChange={(e) => handleModeChange(e.target.value as PricingMode)}
                  sx={{ bgcolor: 'white', borderRadius: 1.5 }}
                >
                  <MenuItem value="manual">Modo Manual: Precios Finales</MenuItem>
                  <MenuItem value="individual_margin">Detallado: Margen por Item</MenuItem>
                  <MenuItem value="global_margin">Global: Margen General</MenuItem>
                </Select>
              </FormControl>
              {pricingMode === "global_margin" && (
                <TextField
                  fullWidth
                  size="small"
                  label="Margen Global (%)"
                  type="number"
                  value={globalMargin}
                  onChange={(e) => setGlobalMargin(Number(e.target.value))}
                  slotProps={{
                    input: {
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      sx: { bgcolor: 'white', borderRadius: 1.5 }
                    }
                  }}
                />
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Customer Search & Select */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, height: '100%', borderColor: '#e2e8f0' }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2.5, gap: 1 }}>
              <User size={18} strokeWidth={1.5} color="#64748b" />
              <Typography sx={{ color: '#475569', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Cliente *
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar RFC o Nombre..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start"><Search size={18} color="#64748b" /></InputAdornment>,
                      sx: { borderRadius: 1.5, bgcolor: '#f8fafc' }
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <Select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    displayEmpty
                    sx={{ borderRadius: 1.5 }}
                  >
                    <MenuItem value=""><em>Seleccionar...</em></MenuItem>
                    {filteredCustomers.map((c) => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            {selectedCustomerData && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fbfcfd', borderRadius: 1.5, border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                  {selectedCustomerData.name} <Box component="span" sx={{ color: '#94a3b8', ml: 1, fontWeight: 400 }}>{selectedCustomerData.rfc || "Sin RFC"}</Box>
                </Typography>
                <IconButton size="small" onClick={() => setSelectedCustomer("")} sx={{ color: '#64748b' }}><X size={18} color="#64748b" /></IconButton>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Items Table Container */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, borderColor: '#e2e8f0', mb: 4, overflow: 'visible' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', py: 2 }}>Producto</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', py: 2, width: 90 }}>Cant</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', py: 2, width: 120 }}>Impuesto</TableCell>
              {pricingMode !== "manual" && (
                <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', py: 2, width: 120 }}>Costo</TableCell>
              )}
              {pricingMode === "individual_margin" && (
                <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', py: 2, width: 90 }}>Margen%</TableCell>
              )}
              <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', py: 2, width: 140 }}>Precio Unit.</TableCell>
              <TableCell align="right" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', py: 2, width: 140 }}>Total</TableCell>
              <TableCell sx={{ py: 2, width: 50 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => {
              const product = products.find(p => p.id === item.productId);
              return (
                <React.Fragment key={index}>
                  <TableRow sx={{ '&:hover': { bgcolor: '#fbfcfd' } }}>
                    <TableCell sx={{ py: 1.5 }}>
                      <FormControl fullWidth size="small">
                        <Select
                          value={item.productId}
                          onChange={(e) => handleProductChange(index, e.target.value)}
                          displayEmpty
                          sx={{ borderRadius: 1.5, bgcolor: '#fff' }}
                        >
                          <MenuItem value=""><em>Seleccionar producto...</em></MenuItem>
                          {filteredProducts.map(p => (
                            <MenuItem key={p.id} value={p.id} disabled={p.stock === 0}>
                              {p.name} {p.sku ? `(${p.sku})` : ""} — ${p.price}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {product && (
                        <Typography sx={{ fontSize: '0.65rem', mt: 0.5, px: 1, fontWeight: 700, color: product.stock === 0 ? '#ef4444' : '#16a34a' }}>
                           Stock: {product.stock} {product.saleUnit || 'uds'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                        slotProps={{ input: { sx: { borderRadius: 1.5, bgcolor: '#fff', textAlign: 'center' } } }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Select
                        fullWidth
                        size="small"
                        value={item.taxMode}
                        onChange={(e) => updateItem(index, 'taxMode', e.target.value as TaxMode)}
                        sx={{ borderRadius: 1.5, bgcolor: '#fff' }}
                      >
                        <MenuItem value="net">Sin IVA</MenuItem>
                        <MenuItem value="gross">Con IVA</MenuItem>
                      </Select>
                    </TableCell>
                    {pricingMode !== "manual" && (
                      <TableCell sx={{ py: 1.5 }}>
                        <TextField
                          size="small"
                          type="number"
                          value={item.cost}
                          onChange={(e) => updateItem(index, 'cost', Number(e.target.value))}
                          slotProps={{ input: { sx: { borderRadius: 1.5, bgcolor: '#fff' } } }}
                        />
                      </TableCell>
                    )}
                    {pricingMode === "individual_margin" && (
                      <TableCell sx={{ py: 1.5 }}>
                        <TextField
                          size="small"
                          type="number"
                          value={item.margin}
                          onChange={(e) => updateItem(index, 'margin', Number(e.target.value))}
                          slotProps={{ input: { sx: { borderRadius: 1.5, bgcolor: '#fff' } } }}
                        />
                      </TableCell>
                    )}
                    <TableCell sx={{ py: 1.5 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={pricingMode === 'manual' ? item.typedPrice : item.typedPrice.toFixed(2)}
                        onChange={(e) => pricingMode === 'manual' && updateItem(index, 'typedPrice', Number(e.target.value))}
                        slotProps={{ 
                          input: { 
                            readOnly: pricingMode !== 'manual',
                            sx: { borderRadius: 1.5, bgcolor: pricingMode !== 'manual' ? '#f8fafc' : '#fff', fontWeight: 700 } 
                          } 
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.5 }}>
                      <Typography sx={{ fontWeight: 800, color: '#1e293b' }}>
                        {formatCurrency(item.totalPrice)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <IconButton size="small" onClick={() => removeItem(index)} sx={{ color: '#cbd5e1', '&:hover': { color: '#ef4444' } }}>
                        <Trash2 size={18} color="#64748b" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={pricingMode === "manual" ? 6 : (pricingMode === "individual_margin" ? 8 : 7)} sx={{ p: 0, borderBottom: 'none' }}>
                       <Box sx={{ px: 2, pb: 2 }}>
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => updateItem(index, 'showDetails', !item.showDetails)}
                            startIcon={item.showDetails ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
                            sx={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, p: 0 }}
                          >
                             Detalles SAT / Extra
                          </Button>
                          <Collapse in={item.showDetails}>
                             <Grid container spacing={2} sx={{ mt: 1, pb: 2 }}>
                                <Grid size={{ xs: 4, md: 2 }}><TextField fullWidth size="small" label="Clave SAT" value={item.satProductKey || ""} onChange={(e) => updateItem(index, 'satProductKey', e.target.value)} /></Grid>
                                <Grid size={{ xs: 4, md: 2 }}><TextField fullWidth size="small" label="Unidad SAT" value={item.satUnitKey || ""} onChange={(e) => updateItem(index, 'satUnitKey', e.target.value)} /></Grid>
                                <Grid size={{ xs: 8, md: 8 }}><TextField fullWidth size="small" label="Descripción Comercial" value={item.description || ""} onChange={(e) => updateItem(index, 'description', e.target.value)} /></Grid>
                             </Grid>
                          </Collapse>
                       </Box>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                   <Box sx={{ color: '#64748b', mb: 1 }}><ShoppingBag size={18} strokeWidth={1} color="#64748b" /></Box>
                   <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>No hay productos agregados a la venta</Typography>
                </TableCell>
              </TableRow>
            )}
            <TableRow>
              <TableCell colSpan={10} sx={{ py: 2 }}>
                <Button
                  variant="text"
                  startIcon={<Plus size={18} />}
                  onClick={addItem}
                  sx={{ color: '#334155', fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#f1f5f9' } }}
                >
                  Agregar Item
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer Grid */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notas Adicionales"
            placeholder="Términos de pago, condiciones de entrega, etc..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: '#fff' } }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderLeft: '6px solid #334155', bgcolor: '#fff' }}>
             <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Subtotal</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#1e293b' }}>{formatCurrency(totalAmountWithoutIVA)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>IVA (16%)</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#eab308' }}>{formatCurrency(ivaAmount)}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pt: 1 }}>
                  <Box>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase' }}>Total a Pagar</Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>{totalItemsCount} unidades totales</Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 900, color: '#16a34a', letterSpacing: '-0.03em' }}>
                    {formatCurrency(totalAmountWithIVA)}
                  </Typography>
                </Box>
             </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
