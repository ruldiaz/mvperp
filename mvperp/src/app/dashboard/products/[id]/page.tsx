"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Product, Variant, PriceList } from "@/types/product";
import Image from "next/image";
import { toast } from "react-hot-toast";
import {
  Box, Typography, Button, TextField, Paper, Checkbox, FormControlLabel,
  CircularProgress, Stack, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, IconButton, FormControl, InputLabel, Grid,
  ToggleButtonGroup, ToggleButton, Chip
} from "@mui/material";
import { 
  ArrowLeft, Info, Package, FileText, Tag, Image as ImageIcon, Plus, Trash2, List as ListIcon, Save, UploadCloud, Edit3, AlertTriangle, Settings
} from "lucide-react";

export default function ProductDetail() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [form, setForm] = useState<Product | null>(null);
  const [image, setImage] = useState("");
  const [originalForm, setOriginalForm] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [newVariant, setNewVariant] = useState<Omit<Variant, "id">>({ type: "", value: "" });
  const [newPriceList, setNewPriceList] = useState<Omit<PriceList, "id">>({ name: "", price: 0 });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const fetchImage = async (imageKey: string) => {
    try {
      const res = await fetch(`/api/proxyImage?imageKey=${imageKey}`);
      if (!res.ok) return; // Silently ignore — not all products have Truper images
      const data = await res.json();
      if (data.imageUrl) setImage(data.imageUrl);
    } catch {
      // Ignore fetch errors for proxy image — it's a best-effort fallback
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`, { credentials: "include" });
        if (!res.ok) throw new Error("Error al cargar el producto");
        const data = await res.json();
        setForm(data.product);
        setOriginalForm(data.product);
        if (data.product.image) {
          setImage(data.product.image);
        } else if (data.product.sku) {
          fetchImage(data.product.sku);
        }
      } catch (err) {
        console.error(err);
        toast.error("No se pudo cargar el producto");
      }
    };
    fetchProduct();
  }, [productId]);

  const handleChange = (e: any) => {
    const target = e.target;
    let newValue: string | number | boolean | undefined;
    if (target.type === "checkbox") {
      newValue = target.checked;
    } else if (target.type === "number") {
      newValue = target.value === "" ? undefined : Number(target.value);
    } else {
      newValue = target.value;
    }
    setForm((prev) => (prev ? { ...prev, [target.name]: newValue } : prev));
  };

  const handleAddVariant = () => {
    if (!newVariant.type || !newVariant.value) {
      toast.error("Completa ambos campos de variante");
      return;
    }
    setForm((prev) => prev ? { ...prev, variants: [...(prev.variants || []), { ...newVariant, id: Date.now().toString() }] } : prev);
    setNewVariant({ type: "", value: "" });
  };

  const handleRemoveVariant = (index: number) => {
    setForm((prev) => prev ? { ...prev, variants: prev.variants?.filter((_, i) => i !== index) || [] } : prev);
  };

  const handleAddPriceList = () => {
    if (!newPriceList.name || newPriceList.price <= 0) {
      toast.error("Nombre y precio válido requeridos");
      return;
    }
    setForm((prev) => prev ? { ...prev, priceLists: [...(prev.priceLists || []), { ...newPriceList, id: Date.now().toString() }] } : prev);
    setNewPriceList({ name: "", price: 0 });
  };

  const handleRemovePriceList = (index: number) => {
    setForm((prev) => prev ? { ...prev, priceLists: prev.priceLists?.filter((_, i) => i !== index) || [] } : prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("product", JSON.stringify(form));
      if (imageFile) {
        formData.append("image", imageFile);
      }
      const res = await fetch(`/api/products/${productId}`, { method: "PUT", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Error al actualizar producto");
      const updatedData = await res.json();
      setForm(updatedData.product);
      setOriginalForm(updatedData.product);
      setIsEditing(false);
      toast.success("Producto actualizado exitosamente");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar el producto");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm(originalForm);
    setIsEditing(false);
    setImageFile(null);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Error al eliminar producto");
      toast.success("Producto eliminado exitosamente");
      router.push("/dashboard/products");
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar el producto");
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount == null) return "$0.00";
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);
  };

  if (!form) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 500 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ color: '#334155', mb: 2 }} />
          <Typography sx={{ color: '#64748b', fontWeight: 500 }}>Cargando producto...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", py: 6, px: 3, animation: "fadeIn 0.3s ease" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 6, flexWrap: "wrap", gap: 3 }}>
        <Box>
           <Button
            variant="text"
            onClick={() => router.push("/dashboard/products")}
            startIcon={<ArrowLeft size={16} />}
            sx={{ textTransform: 'none', color: '#3b82f6', p: 0, mb: 1, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
          >
            Volver a productos
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em', mb: 1 }}>
            {isEditing ? "Editar Producto" : "Detalles del Producto"}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
          {!isEditing ? (
             <Button
                variant="contained"
                onClick={() => setIsEditing(true)}
                startIcon={<Edit3 size={18} />}
                sx={{ borderRadius: 1.5, px: 3, py: 1.2, bgcolor: '#334155', '&:hover': { bgcolor: '#1e293b' }, textTransform: 'none', boxShadow: 'none' }}
              >
                Editar
              </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                color="error"
                onClick={() => setShowDeleteConfirm(true)}
                startIcon={<Trash2 size={18} />}
                sx={{ borderRadius: 1.5, textTransform: 'none', px: 3 }}
              >
                Eliminar
              </Button>
              <Button
                variant="outlined"
                onClick={handleCancel}
                sx={{ borderRadius: 1.5, textTransform: 'none', px: 3, borderColor: '#cbd5e1', color: '#475569' }}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
                sx={{ borderRadius: 1.5, px: 3, bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, textTransform: 'none', boxShadow: 'none' }}
              >
                {loading ? "Actualizando..." : "Actualizar"}
              </Button>
            </>
          )}
        </Stack>
      </Box>

      {error && (
        <Paper variant="outlined" sx={{ p: 2, mb: 4, bgcolor: '#fee2e2', borderColor: '#f87171', color: '#991b1b', borderRadius: 2 }}>
          <Typography variant="body2">{error}</Typography>
        </Paper>
      )}

      {/* Form Content */}
      <Box component="form" id="product-form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        
        {/* Información Básica */}
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: '#e0f2fe', color: '#0284c7' }}>
              <Info size={24} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Información Básica</Typography>
          </Box>
          
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography variant="subtitle2" sx={{ color: '#475569', mb: 1 }}>Imagen del producto</Typography>
              <Box sx={{ 
                width: '100%', height: 250, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#f8fafc', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', mb: 2, position: 'relative'
              }}>
                {image ? (
                  <Image src={image} alt={form.name || "Producto"} fill className="object-contain p-4" onError={() => setImage("/placeholder-image.png")} />
                ) : (
                  <ImageIcon size={48} color="#cbd5e1" />
                )}
              </Box>
              {isEditing && (
                <Button component="label" variant="outlined" fullWidth startIcon={<UploadCloud size={18} />} sx={{ borderRadius: 1.5, textTransform: 'none' }}>
                  Subir Imagen Nueva
                  <input
                    type="file" hidden accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setImageFile(e.target.files[0]);
                        setImage(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                  />
                </Button>
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={3}>
                {isEditing ? (
                  <TextField fullWidth size="small" label="Nombre del producto *" name="name" value={form.name} onChange={handleChange} required sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
                ) : (
                  <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5, border: '1px solid #e2e8f0' }}><Typography variant="body2" sx={{ fontWeight: 600 }}>{form.name}</Typography></Box>
                )}
                
                {isEditing ? (
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo *</InputLabel>
                    <Select name="type" value={form.type} onChange={handleChange} label="Tipo *" sx={{ borderRadius: 1.5 }}>
                      <MenuItem value="producto">Producto</MenuItem>
                      <MenuItem value="servicio">Servicio</MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                   <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                     <Typography variant="body2">{form.type === 'servicio' ? 'Servicio' : 'Producto'}</Typography>
                   </Box>
                )}

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    {isEditing ? <TextField fullWidth size="small" label="SKU" name="sku" value={form.sku || ""} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} /> : <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5, border: '1px solid #e2e8f0' }}><Typography variant="body2" sx={{ color: '#64748b' }}>SKU: <span style={{ color: '#1e293b' }}>{form.sku || "—"}</span></Typography></Box>}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    {isEditing ? <TextField fullWidth size="small" label="Código de barras" name="barcode" value={form.barcode || ""} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} /> : <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5, border: '1px solid #e2e8f0' }}><Typography variant="body2" sx={{ color: '#64748b' }}>Barcode: <span style={{ color: '#1e293b' }}>{form.barcode || "—"}</span></Typography></Box>}
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    {isEditing ? <TextField fullWidth size="small" label="Categoría" name="category" value={form.category || ""} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} /> :  <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5, border: '1px solid #e2e8f0' }}><Typography variant="body2" sx={{ color: '#64748b' }}>Categoría: <span style={{ color: '#1e293b' }}>{form.category || "—"}</span></Typography></Box>}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    {isEditing ? <TextField fullWidth size="small" label="Marca" name="brand" value={form.brand || ""} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} /> : <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5, border: '1px solid #e2e8f0' }}><Typography variant="body2" sx={{ color: '#64748b' }}>Marca: <span style={{ color: '#1e293b' }}>{form.brand || "—"}</span></Typography></Box>}
                  </Grid>
                </Grid>

                {isEditing ? (
                  <TextField fullWidth size="small" label="Descripción" name="description" multiline rows={3} value={form.description || ""} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
                ) : (
                  <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5, border: '1px solid #e2e8f0', minHeight: 80 }}>
                    <Typography variant="body2" sx={{ color: form.description ? '#1e293b' : '#94a3b8' }}>{form.description || "Sin descripción"}</Typography>
                  </Box>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            {/* Inventario y Precios */}
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0', minHeight: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: '#dcfce7', color: '#16a34a' }}>
                  <Package size={24} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Inventario y Precios</Typography>
              </Box>
              <Stack spacing={3}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    {isEditing ? (
                      <TextField fullWidth size="small" label="Precio principal" name="price" type="number" value={form.price ?? ""} onChange={handleChange} slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
                    ) : ( 
                      <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Precio principal</Typography>
                        <Typography variant="body1" sx={{ color: '#16a34a', fontWeight: 700 }}>{formatCurrency(form.price)}</Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    {isEditing ? (
                       <TextField fullWidth size="small" label="Costo" name="cost" type="number" value={form.cost ?? ""} onChange={handleChange} slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
                    ) : (
                      <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Costo</Typography>
                        <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 500 }}>{formatCurrency(form.cost)}</Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>Precios:</Typography>
                  {isEditing ? (
                    <ToggleButtonGroup
                      value={form.ivaIncluded ? "con" : "sin"}
                      exclusive
                      onChange={(_, val) => {
                        if (val !== null) setForm((prev) => prev ? { ...prev, ivaIncluded: val === "con" } : prev);
                      }}
                      size="small"
                      sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontSize: '0.75rem', px: 1.5, py: 0.3, borderColor: '#cbd5e1', '&.Mui-selected': { bgcolor: '#334155', color: '#fff', '&:hover': { bgcolor: '#1e293b' } } } }}
                    >
                      <ToggleButton value="con">Con IVA</ToggleButton>
                      <ToggleButton value="sin">Sin IVA</ToggleButton>
                    </ToggleButtonGroup>
                  ) : (
                    <Chip
                      label={form.ivaIncluded ? "Con IVA incluido" : "Sin IVA (se suma aparte)"}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.72rem',
                        bgcolor: form.ivaIncluded ? '#dcfce7' : '#fef3c7',
                        color: form.ivaIncluded ? '#16a34a' : '#d97706',
                        border: `1px solid ${form.ivaIncluded ? '#bbf7d0' : '#fde68a'}`,
                      }}
                    />
                  )}
                </Box>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    {isEditing ? (
                      <TextField fullWidth size="small" label="Stock actual" name="stock" type="number" value={form.stock ?? ""} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
                    ) : (
                      <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Stock actual</Typography>
                        <Typography variant="body1" sx={{ color: (form.stock ?? 0) <= (form.minimumQuantity ?? 5) ? '#dc2626' : '#1e293b', fontWeight: 600 }}>{form.stock ?? 0}</Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    {isEditing ? (
                       <TextField fullWidth size="small" label="Cantidad mínima" name="minimumQuantity" type="number" value={form.minimumQuantity ?? ""} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
                    ) : (
                      <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Cantidad mínima</Typography>
                         <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 500 }}>{form.minimumQuantity ?? "—"}</Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                   <Grid size={{ xs: 12, sm: 6 }}>
                    {isEditing ? <TextField fullWidth size="small" label="Unidad de venta" name="saleUnit" value={form.saleUnit || ""} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} /> : <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5, border: '1px solid #e2e8f0' }}><Typography variant="body2" sx={{ color: '#64748b' }}>Unidad: <span style={{ color: '#1e293b' }}>{form.saleUnit || "—"}</span></Typography></Box>}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    {isEditing ? <TextField fullWidth size="small" label="Ubicación almacén" name="location" value={form.location || ""} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} /> : <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5, border: '1px solid #e2e8f0' }}><Typography variant="body2" sx={{ color: '#64748b' }}>Ubicación: <span style={{ color: '#1e293b' }}>{form.location || "—"}</span></Typography></Box>}
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={1}>
                    {[
                      { name: "useStock", label: "Controlar stock" },
                      { name: "sellAtPOS", label: "Punto de venta" },
                      { name: "includeInCatalog", label: "Catálogo online" },
                      { name: "requirePrescription", label: "Receta médica" },
                    ].map((field) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={field.name}>
                        <FormControlLabel
                          control={<Checkbox size="small" disabled={!isEditing} name={field.name} checked={Boolean(form[field.name as keyof Product])} onChange={handleChange} sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#334155' } }} />}
                          label={<Typography variant="body2" sx={{ color: '#475569' }}>{field.label}</Typography>}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            {/* Información Fiscal */}
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0', minHeight: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: '#fef3c7', color: '#d97706' }}>
                  <FileText size={24} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Información Fiscal</Typography>
              </Box>
              <Stack spacing={3}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    {isEditing ? <TextField fullWidth size="small" label="Clave SAT (Producto)" name="satKey" value={form.satKey || ""} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} /> : <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5, border: '1px solid #e2e8f0' }}><Typography variant="body2" sx={{ color: '#64748b' }}>Clave SAT: <span style={{ color: '#1e293b' }}>{form.satKey || "—"}</span></Typography></Box>}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    {isEditing ? <TextField fullWidth size="small" label="Clave SAT (Unidad)" name="satUnitKey" value={form.satUnitKey || ""} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} /> : <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5, border: '1px solid #e2e8f0' }}><Typography variant="body2" sx={{ color: '#64748b' }}>Clave Unidad: <span style={{ color: '#1e293b' }}>{form.satUnitKey || "—"}</span></Typography></Box>}
                  </Grid>
                </Grid>
                
                <Grid container spacing={2}>
                   <Grid size={{ xs: 12, sm: 6 }}>
                    {isEditing ? <TextField fullWidth size="small" label="IVA (%)" name="iva" type="number" value={form.iva ?? ""} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} /> : <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5, border: '1px solid #e2e8f0' }}><Typography variant="body2" sx={{ color: '#64748b' }}>IVA: <span style={{ color: '#1e293b' }}>{form.iva ?? "—"}%</span></Typography></Box>}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    {isEditing ? <TextField fullWidth size="small" label="IEPS (%)" name="ieps" type="number" value={form.ieps ?? ""} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} /> : <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5, border: '1px solid #e2e8f0' }}><Typography variant="body2" sx={{ color: '#64748b' }}>IEPS: <span style={{ color: '#1e293b' }}>{form.ieps ?? "—"}%</span></Typography></Box>}
                  </Grid>
                </Grid>
                
                <FormControlLabel
                  control={<Checkbox disabled={!isEditing} size="small" name="ivaIncluded" checked={Boolean(form.ivaIncluded)} onChange={handleChange} sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#334155' } }} />}
                  label={<Typography variant="body2" sx={{ color: '#475569' }}>Precio incluye impuestos</Typography>}
                />
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Variantes */}
        {isEditing && (
          <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: '#fae8ff', color: '#c026d3' }}>
                <Tag size={24} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Variantes</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <TextField size="small" label="Tipo (ej. Color)" value={newVariant.type} onChange={(e) => setNewVariant({ ...newVariant, type: e.target.value })} sx={{ minWidth: 200, "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
              <TextField size="small" label="Valor (ej. Rojo)" value={newVariant.value} onChange={(e) => setNewVariant({ ...newVariant, value: e.target.value })} sx={{ minWidth: 200, "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
              <Button variant="outlined" onClick={handleAddVariant} startIcon={<Plus size={18} />} sx={{ borderRadius: 1.5, textTransform: 'none', color: '#16a34a', borderColor: '#16a34a', '&:hover': { bgcolor: '#f0fdf4' } }}>
                Agregar Variante
              </Button>
            </Box>
            <Stack spacing={1}>
              {form.variants?.map((variant, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, px: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9' }}>
                  <Typography variant="body2" sx={{ color: '#334155' }}><strong>{variant.type}:</strong> {variant.value}</Typography>
                  <IconButton size="small" onClick={() => handleRemoveVariant(index)} sx={{ color: '#ef4444' }}><Trash2 size={16} /></IconButton>
                </Box>
              ))}
              {(!form.variants || form.variants.length === 0) && <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin variantes definidas</Typography>}
            </Stack>
          </Paper>
        )}

        {/* Listas de Precios */}
        {isEditing && (
           <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: '#e0e7ff', color: '#4f46e5' }}>
                <ListIcon size={24} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Listas de Precios Adicionales</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <TextField size="small" label="Nombre (ej. Mayoreo)" value={newPriceList.name} onChange={(e) => setNewPriceList({ ...newPriceList, name: e.target.value })} sx={{ minWidth: 200, "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
              <TextField size="small" label="Precio" type="number" value={newPriceList.price} onChange={(e) => setNewPriceList({ ...newPriceList, price: Number(e.target.value) })} sx={{ minWidth: 200, "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
              <Button variant="outlined" onClick={handleAddPriceList} startIcon={<Plus size={18} />} sx={{ borderRadius: 1.5, textTransform: 'none', color: '#16a34a', borderColor: '#16a34a', '&:hover': { bgcolor: '#f0fdf4' } }}>
                Agregar Lista
              </Button>
            </Box>
            <Stack spacing={1}>
              {form.priceLists?.map((priceList, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, px: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9' }}>
                  <Typography variant="body2" sx={{ color: '#334155' }}><strong>{priceList.name}:</strong> {formatCurrency(priceList.price)}</Typography>
                  <IconButton size="small" onClick={() => handleRemovePriceList(index)} sx={{ color: '#ef4444' }}><Trash2 size={16} /></IconButton>
                </Box>
              ))}
              {(!form.priceLists || form.priceLists.length === 0) && <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin listas adicionales</Typography>}
            </Stack>
          </Paper>
        )}
      </Box>

      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} sx={{ '& .MuiDialog-paper': { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700, color: '#1e293b' }}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center' }}>
            <AlertTriangle size={24} />
          </Box>
          Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#475569', mt: 1 }}>
            ¿Estás seguro de que quieres eliminar el producto <Typography component="span" sx={{ fontWeight: 700, color: '#1e293b' }}>{form.name}</Typography>? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowDeleteConfirm(false)} sx={{ color: '#64748b', textTransform: 'none', borderRadius: 1.5 }}>Cancelar</Button>
          <Button onClick={handleDelete} variant="contained" color="error" sx={{ textTransform: 'none', borderRadius: 1.5, px: 3, bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' }, boxShadow: 'none' }}>
            Sí, eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
