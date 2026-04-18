// src/app/dashboard/invoices/create/page.tsx
"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Product } from "@/types/product";
import { Customer } from "@/types/customer";
import { SaleItem } from "@/types/sale";
import { CreateInvoiceRequest } from "@/types/invoice";
import { toast } from "react-hot-toast";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  Stack,
  CircularProgress,
  Grid,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
  Tooltip,
  Alert
} from "@mui/material";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  FileText,
  User,
  CreditCard,
  Briefcase,
  Hash,
  Info,
  Package,
  ShoppingCart
} from "lucide-react";

// Interfaz local para los items del formulario
interface InvoiceItemForm {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  satProductKey?: string;
  satUnitKey?: string;
}

function CreateInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const saleId = searchParams.get("saleId");

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<InvoiceItemForm[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("PUE");
  const [paymentForm, setPaymentForm] = useState("01");
  const [cfdiUse, setCfdiUse] = useState("G03");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [productsRes, customersRes] = await Promise.all([
          fetch("/api/products", { credentials: "include" }),
          fetch("/api/customers", { credentials: "include" }),
        ]);

        if (!productsRes.ok) throw new Error("Error cargando productos");
        if (!customersRes.ok) throw new Error("Error cargando clientes");

        const productsData = await productsRes.json();
        const customersData = await customersRes.json();

        setProducts(productsData.products || []);
        setCustomers(customersData.customers || []);

        if (saleId) {
          const saleRes = await fetch(`/api/sales/${saleId}`, { credentials: "include" });
          if (saleRes.ok) {
            const saleData = await saleRes.json();
            setSelectedCustomer(saleData.sale.customerId);
            setItems(
              saleData.sale.saleItems.map((item: SaleItem & { product?: { name: string } }) => ({
                productId: item.productId,
                description: item.product?.name || item.description || "",
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                satProductKey: item.satProductKey || "",
                satUnitKey: item.satUnitKey || "",
              }))
            );
          }
        }
      } catch (err) {
        console.error(err);
        setError("Error al cargar los datos necesarios");
        toast.error("Error al cargar datos");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [saleId]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { description: "", quantity: 1, unitPrice: 0, totalPrice: 0, satProductKey: "", satUnitKey: "" },
    ]);
  };

  const updateItem = (index: number, field: keyof InvoiceItemForm, value: string | number) => {
    setItems((prevItems) => {
      const newItems = [...prevItems];
      const updatedItem = { ...newItems[index], [field]: value };
      
      if (field === "quantity" || field === "unitPrice") {
        const qty = Number(updatedItem.quantity) || 0;
        const price = Number(updatedItem.unitPrice) || 0;
        updatedItem.totalPrice = qty * price;
      }
      
      newItems[index] = updatedItem;
      return newItems;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setItems((prevItems) => {
        const newItems = [...prevItems];
        newItems[index] = {
          ...newItems[index],
          productId: productId,
          description: product.name,
          unitPrice: product.price || 0,
          totalPrice: newItems[index].quantity * (product.price || 0),
          satProductKey: product.satKey || "",
          satUnitKey: product.satUnitKey || "",
        };
        return newItems;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) { toast.error("Selecciona un cliente"); return; }
    if (items.length === 0) { toast.error("Agrega al menos un item"); return; }
    if (items.some(i => !i.description.trim())) { toast.error("Descripción requerida en todos los items"); return; }

    setLoading(true);
    setError("");

    try {
      const invoiceData: CreateInvoiceRequest = {
        saleId: saleId || undefined,
        customerId: selectedCustomer,
        invoiceItems: items.map((item) => ({
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          satProductKey: item.satProductKey,
          satUnitKey: item.satUnitKey,
        })),
        paymentMethod,
        paymentForm,
        cfdiUse,
        currency: "MXN",
      };

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear la factura");

      toast.success("Factura creada exitosamente");
      router.push("/dashboard/invoices");
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Error al crear la factura";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxes = subtotal * 0.16;
  const total = subtotal + taxes;

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Stack sx={{ alignItems: "center" }} spacing={2}>
          <CircularProgress size={32} sx={{ color: "#334155" }} />
          <Typography sx={{ color: "#64748b" }}>Preparando entorno de facturación...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", py: 6, px: 3, animation: "fadeIn 0.3s ease" }}>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 6, flexWrap: "wrap", gap: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em', mb: 1 }}>
            {saleId ? "Facturar Venta" : "Nueva Factura"}
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.95rem' }}>
            {saleId ? "Genera el comprobante fiscal desde una venta realizada" : "Crea una factura directa ingresando los conceptos manualmente"}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => router.back()}
          startIcon={<ArrowLeft size={18} strokeWidth={1.5} />}
          sx={{ borderRadius: 1.5, textTransform: 'none', px: 3, py: 1.2, borderColor: '#e2e8f0', color: '#475569', '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' } }}
        >
          Cancelar
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>{error}</Alert>
      )}

      <Grid container spacing={4}>
        {/* Main Form Area */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={4}>
            {/* Customer & Fiscal Info */}
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Box sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 1.5, display: 'flex' }}>
                  <User size={18} color="#64748b" />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Información del Cliente</Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="customer-select-label">Cliente *</InputLabel>
                    <Select
                      labelId="customer-select-label"
                      value={selectedCustomer}
                      onChange={(e) => setSelectedCustomer(e.target.value)}
                      label="Cliente *"
                      disabled={!!saleId}
                      sx={{ borderRadius: 1.5 }}
                    >
                      <MenuItem value=""><em>Seleccionar cliente</em></MenuItem>
                      {customers.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.name} {c.rfc && `(${c.rfc})`}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select fullWidth size="small" label="Forma de Pago *" value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                  >
                    <MenuItem value="PUE">Pago en una sola exhibición</MenuItem>
                    <MenuItem value="PPD">Pago en parcialidades o diferido</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select fullWidth size="small" label="Método de Pago *" value={paymentForm}
                    onChange={(e) => setPaymentForm(e.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                  >
                    <MenuItem value="01">Efectivo</MenuItem>
                    <MenuItem value="02">Cheque</MenuItem>
                    <MenuItem value="03">Transferencia</MenuItem>
                    <MenuItem value="04">Tarjeta de crédito</MenuItem>
                    <MenuItem value="05">Tarjeta de débito</MenuItem>
                    <MenuItem value="06">Aplicación de anticipos</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select fullWidth size="small" label="Uso CFDI *" value={cfdiUse}
                    onChange={(e) => setCfdiUse(e.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                  >
                    <MenuItem value="G03">G03 - Gastos en general</MenuItem>
                    <MenuItem value="P01">P01 - Por definir</MenuItem>
                    <MenuItem value="G01">G01 - Adquisición de mercancías</MenuItem>
                    <MenuItem value="S01">S01 - Sin efectos fiscales</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Paper>

            {/* Concepts Table */}
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 1.5, display: 'flex' }}>
                    <Package size={18} color="#64748b" />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Conceptos</Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Plus size={18} color="#64748b" />}
                  onClick={addItem}
                  sx={{ borderRadius: 1.5, textTransform: 'none', px: 2, borderColor: '#cbd5e1', color: '#475569' }}
                >
                  Agregar Concepto
                </Button>
              </Box>

              <TableContainer sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Descripción / SAT</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', width: 100 }}>Cant.</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', width: 120 }}>Unitario</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', width: 130 }}>Total</TableCell>
                      <TableCell align="right" sx={{ width: 50 }}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ py: 6, textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ color: '#94a3b8' }}>No hay conceptos agregados. Haz clic en "Agregar Concepto".</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ verticalAlign: 'top', pt: 2 }}>
                            <Stack spacing={1.5}>
                              {!saleId ? (
                                <Autocomplete
                                  size="small"
                                  options={products}
                                  getOptionLabel={(p) => `${p.name} ${p.sku ? `(${p.sku})` : ''}`}
                                  value={products.find(p => p.id === item.productId) || null}
                                  onChange={(_, val) => handleProductChange(idx, val?.id || "")}
                                  renderInput={(params) => <TextField {...params} label="Seleccionar Producto" />}
                                />
                              ) : null}
                              <TextField
                                fullWidth size="small" multiline rows={2} placeholder="Descripción detallada"
                                value={item.description}
                                onChange={(e) => updateItem(idx, "description", e.target.value)}
                                slotProps={{ input: { sx: { fontSize: '0.875rem' } } }}
                              />
                              <Grid container spacing={1}>
                                <Grid size={{ xs: 6 }}>
                                  <TextField 
                                    fullWidth size="small" label="Clave SAT" value={item.satProductKey} 
                                    onChange={(e) => updateItem(idx, "satProductKey", e.target.value)}
                                    slotProps={{ input: { sx: { fontSize: '0.75rem', fontFamily: 'monospace' } } }}
                                  />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                  <TextField 
                                    fullWidth size="small" label="Unidad" value={item.satUnitKey} 
                                    onChange={(e) => updateItem(idx, "satUnitKey", e.target.value)}
                                    slotProps={{ input: { sx: { fontSize: '0.75rem', fontFamily: 'monospace' } } }}
                                  />
                                </Grid>
                              </Grid>
                            </Stack>
                          </TableCell>
                          <TableCell align="center" sx={{ verticalAlign: 'top', pt: 2 }}>
                            <TextField
                              type="number" size="small" value={item.quantity}
                              onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                              slotProps={{ input: { inputProps: { min: 1, style: { textAlign: 'center' } } } }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ verticalAlign: 'top', pt: 2 }}>
                            <TextField
                              type="number" size="small" value={item.unitPrice}
                              onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                              slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ verticalAlign: 'top', pt: 3 }}>
                            <Typography sx={{ fontWeight: 700, color: '#1e293b' }}>
                              ${item.totalPrice.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ verticalAlign: 'top', pt: 2 }}>
                            <Tooltip title="Eliminar Linea">
                              <IconButton onClick={() => removeItem(idx)} size="small" sx={{ color: '#64748b', bgcolor: '#f1f5f9' }}>
                                <Trash2 size={18} color="#64748b" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Stack>
        </Grid>

        {/* Sidebar Summary */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0', bgcolor: '#f8fafc' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Box sx={{ p: 1, bgcolor: '#f1f5f9', borderRadius: 1.5, display: 'flex' }}>
                  <CreditCard size={18} color="#64748b" />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Resumen</Typography>
              </Box>

              <Stack spacing={2} sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Subtotal</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>${subtotal.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>IVA (16%)</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>${taxes.toFixed(2)}</Typography>
                </Box>
                <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Total</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#10b981' }}>${total.toFixed(2)}</Typography>
                </Box>
              </Stack>

              <Button
                fullWidth
                variant="contained"
                onClick={handleSubmit}
                disabled={loading || items.length === 0 || !selectedCustomer}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
                sx={{
                  bgcolor: '#334155',
                  '&:hover': { bgcolor: '#1e293b' },
                  textTransform: 'none',
                  borderRadius: 2,
                  py: 1.5,
                  boxShadow: 'none',
                  fontWeight: 600
                }}
              >
                {loading ? "Procesando..." : "Crear Factura"}
              </Button>

              <Box sx={{ mt: 3 }}>
                <Stack spacing={1.5}>
                   <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Info size={18} color="#64748b" style={{ marginTop: 2 }} />
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Al confirmar, se generará el documento digital (XML) y se solicitará el timbrado al PAC.
                      </Typography>
                   </Box>
                </Stack>
              </Box>
            </Paper>
            
            {saleId && (
              <Alert icon={<ShoppingCart size={18} />} severity="info" sx={{ borderRadius: 2 }}>
                Esta factura está vinculada a la venta <strong>#{saleId.slice(0, 8)}</strong>
              </Alert>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export default function CreateInvoice() {
  return (
    <Suspense fallback={<Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress /></Box>}>
      <CreateInvoiceContent />
    </Suspense>
  );
}
