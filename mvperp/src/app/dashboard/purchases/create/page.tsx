// src/app/dashboard/purchases/create/page.tsx
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PurchaseItemRequest } from "@/types/purchase";
import { Product } from "@/types/product";
import { toast } from "react-hot-toast";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  MenuItem,
  CircularProgress,
  Stack,
  Alert,
  Divider,
  InputAdornment
} from "@mui/material";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  ShoppingBag,
  Info,
  Save,
  X,
  UserPlus
} from "lucide-react";

interface PurchaseItem extends PurchaseItemRequest {
  totalPrice: number;
}

export default function CreatePurchase() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supplierId = searchParams.get("supplierId");

  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const res = await fetch("/api/products", { credentials: "include" });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Error al cargar productos");
        }
        const data = await res.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error("Error fetching products:", error);
        const message = error instanceof Error ? error.message : "Error al cargar los productos";
        toast.error(message);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  const addItem = () => {
    setItems([
      ...items,
      { productId: "", quantity: 1, unitPrice: 0, totalPrice: 0 },
    ]);
  };

  const updateItem = (index: number, field: string, value: unknown) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    // Auto-calculate unit price if product is selected for the first time
    if (field === "productId" && value) {
      const selectedProd = products.find(p => p.id === value);
      if (selectedProd) {
        item.unitPrice = selectedProd.cost || 0;
      }
    }

    if (field === "quantity" || field === "unitPrice" || field === "productId") {
      item.totalPrice = Number(item.quantity) * Number(item.unitPrice);
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId) {
      toast.error("Debes seleccionar un proveedor antes de crear la compra");
      return;
    }

    if (items.length === 0) {
      toast.error("Agrega al menos un producto a la compra");
      return;
    }

    const hasEmptyProduct = items.some((item) => !item.productId);
    if (hasEmptyProduct) {
      toast.error("Todos los productos deben estar seleccionados");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId, items, notes }),
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Compra registrada exitosamente");
        router.push("/dashboard/purchases");
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error desconocido");
      }
    } catch (error) {
      console.error("Error creating purchase:", error);
      const message = error instanceof Error ? error.message : "Error de conexión";
      toast.error(`Error al crear la compra: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.totalPrice, 0), [items]);

  const purchasableProducts = useMemo(() => 
    products.filter((product) => product.type === "producto"), 
  [products]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  if (loadingProducts && products.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Stack sx={{ alignItems: 'center' }} spacing={2}>
          <CircularProgress size={32} sx={{ color: '#334155' }} />
          <Typography sx={{ color: '#64748b' }}>Cargando catálogo...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", py: 4, px: { xs: 2, md: 3 }, animation: 'fadeIn 0.3s ease' }}>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 4, flexWrap: "wrap", gap: 3 }}>
        <Box>
          <Button
            startIcon={<ArrowLeft size={16} />}
            onClick={() => router.back()}
            sx={{ color: '#64748b', mb: 1.5, p: 0, '&:hover': { bgcolor: 'transparent', color: '#1e293b' }, textTransform: 'none' }}
          >
            Volver a compras
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em' }}>
            Registrar Compra
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            onClick={() => router.back()}
            sx={{ borderRadius: 2, px: 3, py: 1, textTransform: 'none', borderColor: '#cbd5e1', color: '#475569' }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={isSubmitting || !supplierId || items.length === 0}
            onClick={handleSubmit}
            startIcon={isSubmitting ? <CircularProgress size={14} color="inherit" /> : <Save size={18} strokeWidth={1.5} />}
            sx={{ borderRadius: 2, px: 4, py: 1, bgcolor: '#334155', '&:hover': { bgcolor: '#1e293b' }, textTransform: 'none', boxShadow: 'none' }}
          >
            {isSubmitting ? "Registrando..." : "Guardar Compra"}
          </Button>
        </Stack>
      </Box>

      {/* Supplier Missing Warning */}
      {!supplierId && (
        <Alert 
          severity="warning" 
          variant="outlined" 
          icon={<Info size={20} />}
          action={
            <Button color="inherit" size="small" onClick={() => router.push("/dashboard/suppliers")} sx={{ fontWeight: 700, textTransform: 'none' }}>
              IR A PROVEEDORES
            </Button>
          }
          sx={{ mb: 4, borderRadius: 2, bgcolor: '#fffbed', borderColor: '#fef08a', color: '#854d0e', '& .MuiAlert-icon': { color: '#854d0e' } }}
        >
          Debes seleccionar un proveedor antes de registrar la entrada de mercancía.
        </Alert>
      )}

      {/* Main Form Area */}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Left: Items Table */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Paper variant="outlined" sx={{ borderRadius: 3, borderColor: '#e2e8f0', overflow: 'hidden' }}>
              <Box sx={{ p: 2.5, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
                <Typography sx={{ fontWeight: 700, color: '#475569', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Package size={18} /> Detalle de Productos
                </Typography>
                <Button
                  size="small"
                  startIcon={<Plus size={16} />}
                  onClick={addItem}
                  disabled={!supplierId}
                  sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 600 }}
                >
                  Agregar producto
                </Button>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#fff' }}>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem', py: 1.5 }}>PRODUCTO</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem', py: 1.5 }} width="100">CANT.</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem', py: 1.5 }} width="130">P. UNITARIO</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem', py: 1.5 }} width="130">TOTAL</TableCell>
                      <TableCell sx={{ py: 1.5 }} width="50" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                          <Stack sx={{ alignItems: 'center' }} spacing={1}>
                            <ShoppingBag size={32} strokeWidth={1} style={{ opacity: 0.5 }} />
                            <Typography variant="body2">No hay productos en esta compra</Typography>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item, index) => (
                        <TableRow key={index} sx={{ '&:hover': { bgcolor: '#fbfcfd' } }}>
                          <TableCell sx={{ py: 1.5 }}>
                            <TextField
                              select
                              fullWidth
                              size="small"
                              value={item.productId}
                              onChange={(e) => updateItem(index, "productId", e.target.value)}
                              disabled={!supplierId}
                              sx={{ 
                                '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' },
                                '& .MuiSelect-select': { fontSize: '0.875rem' }
                              }}
                            >
                              <MenuItem value=""><em>Seleccionar producto</em></MenuItem>
                              {purchasableProducts.map((p) => (
                                <MenuItem key={p.id} value={p.id} sx={{ fontSize: '0.875rem' }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                                    <Typography variant="inherit">{p.name}</Typography>
                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>{p.sku}</Typography>
                                  </Box>
                                </MenuItem>
                              ))}
                            </TextField>
                          </TableCell>
                          <TableCell sx={{ py: 1.5 }}>
                            <TextField
                              type="number"
                              size="small"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, "quantity", e.target.value)}
                              disabled={!supplierId}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }}
                              slotProps={{
                                htmlInput: { min: 0, step: 0.1, style: { fontSize: '0.875rem' } }
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 1.5 }}>
                            <TextField
                              type="number"
                              size="small"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                              disabled={!supplierId}
                              slotProps={{
                                input: {
                                  startAdornment: <InputAdornment position="start" sx={{ '& .MuiTypography-root': { fontSize: '0.75rem' } }}>$</InputAdornment>,
                                  style: { fontSize: '0.875rem' }
                                },
                                htmlInput: { min: 0, step: 0.01 }
                              }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 1.5 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>
                              {formatCurrency(item.totalPrice)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1.5 }} align="right">
                            <IconButton size="small" onClick={() => removeItem(index)} sx={{ color: '#f87171' }}>
                              <Trash2 size={16} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Right: Summary & Notes */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={3}>
              {/* Summary Paper */}
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: '#e2e8f0', bgcolor: '#f8fafc' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: '1rem', color: '#1e293b' }}>Resumen</Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>Artículos</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{items.length}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 700, color: '#1e293b' }}>Total Compra</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#16a34a' }}>
                      {formatCurrency(totalAmount)}
                    </Typography>
                  </Box>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={isSubmitting || !supplierId || items.length === 0}
                    onClick={handleSubmit}
                    sx={{ mt: 2, py: 1.5, borderRadius: 2, bgcolor: '#334155', '&:hover': { bgcolor: '#1e293b' }, textTransform: 'none', boxShadow: 'none', fontWeight: 700 }}
                  >
                    Registrar Factura/Orden
                  </Button>
                </Stack>
              </Paper>

              {/* Notes Paper */}
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: '#e2e8f0' }}>
                <Typography variant="button" sx={{ display: 'block', mb: 1.5, color: '#94a3b8', fontWeight: 600 }}>
                  Notas Adicionales
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Referencia de factura, condiciones, etc..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.875rem' } }}
                />
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}
