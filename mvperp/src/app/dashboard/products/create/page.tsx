"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product, Variant, PriceList } from "@/types/product";
import { toast } from "react-hot-toast";
import {
  Box, Typography, Button, TextField, Paper, Checkbox, 
  CircularProgress, Stack, Select, MenuItem, InputAdornment, IconButton, Divider,
  FormControlLabel, InputLabel, FormControl, SelectChangeEvent, Grid
} from "@mui/material";
import { 
  ArrowLeft, Info, Package, DollarSign, FileText, Tag, Image as ImageIcon, Plus, Trash2, List as ListIcon, Save, UploadCloud, X
} from "lucide-react";

export default function CreateProduct() {
  const router = useRouter();
  const [form, setForm] = useState<Product>({
    name: "",
    type: "producto",
    sellAtPOS: false,
    includeInCatalog: false,
    requirePrescription: false,
    useStock: true,
    ivaIncluded: true,
  });
  const [variants, setVariants] = useState<Variant[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [newVariant, setNewVariant] = useState<Omit<Variant, "id">>({
    type: "",
    value: "",
  });
  const [newPriceList, setNewPriceList] = useState<Omit<PriceList, "id">>({
    name: "",
    price: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const target = e.target as HTMLInputElement;
    let value: string | number | boolean | undefined;
    if (target.type === "checkbox") {
      value = target.checked;
    } else if (target.type === "number") {
      value = target.value === "" ? undefined : Number(target.value);
    } else {
      value = target.value;
    }
    setForm((prev) => ({
      ...prev,
      [target.name]: value,
    }));
  };

  const handleAddVariant = () => {
    if (!newVariant.type || !newVariant.value) {
      toast.error("Completa ambos campos de variante");
      return;
    }
    setVariants([...variants, { ...newVariant, id: Date.now().toString() }]);
    setNewVariant({ type: "", value: "" });
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleAddPriceList = () => {
    if (!newPriceList.name || newPriceList.price <= 0) {
      toast.error("Nombre y precio válido requeridos");
      return;
    }
    setPriceLists([
      ...priceLists,
      { ...newPriceList, id: Date.now().toString() },
    ]);
    setNewPriceList({ name: "", price: 0 });
  };

  const handleRemovePriceList = (index: number) => {
    setPriceLists(priceLists.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("El nombre del producto es obligatorio");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      const productData = {
        ...form,
        variants,
        priceLists,
      };
      formData.append("product", JSON.stringify(productData));
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch("/api/products", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear producto");
      }

      toast.success("Producto creado exitosamente");
      router.push("/dashboard/products");
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : "Error desconocido al crear el producto";
      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", py: 6, px: 3, animation: "fadeIn 0.3s ease" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 6, flexWrap: "wrap", gap: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em', mb: 1 }}>
            Crear Producto
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.95rem' }}>
            Completa la información para registrar un nuevo producto
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
        <Paper variant="outlined" sx={{ p: 2, mb: 4, bgcolor: '#fee2e2', borderColor: '#f87171', color: '#991b1b', borderRadius: 2 }}>
          <Typography variant="body2">{error}</Typography>
        </Paper>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        
        {/* Información Básica */}
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <Info size={18} color="#64748b" strokeWidth={1.5} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Información Básica</Typography>
          </Box>
          
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography variant="subtitle2" sx={{ color: '#475569', mb: 1 }}>Imagen del producto</Typography>
              <Box sx={{ 
                width: '100%', height: 250, border: '1px dashed #cbd5e1', borderRadius: 2, bgcolor: '#f8fafc', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', mb: 2
              }}>
                {form.image ? (
                  <Box component="img" src={form.image} sx={{ objectFit: 'contain', width: '100%', height: '100%', p: 1 }} />
                ) : (
                  <ImageIcon size={48} color="#cbd5e1" strokeWidth={1.5} />
                )}
              </Box>
              <Button component="label" variant="outlined" fullWidth startIcon={<UploadCloud size={18} strokeWidth={1.5} />} sx={{ borderRadius: 1.5, textTransform: 'none' }}>
                Subir Imagen Reemplazo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      const file = e.target.files[0];
                      setImageFile(file);
                      const url = URL.createObjectURL(file);
                      setForm((prev) => ({ ...prev, image: url }));
                    }
                  }}
                />
              </Button>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={3}>
                <TextField
                  fullWidth size="small" label="Nombre del producto *" name="name"
                  value={form.name} onChange={handleChange} required
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                />
                
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo *</InputLabel>
                  <Select name="type" value={form.type} onChange={handleChange} label="Tipo *" sx={{ borderRadius: 1.5 }}>
                    <MenuItem value="producto">Producto</MenuItem>
                    <MenuItem value="servicio">Servicio</MenuItem>
                  </Select>
                </FormControl>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="SKU" name="sku" value={form.sku || ""} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Código de barras" name="barcode" value={form.barcode || ""} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Categoría" name="category" value={form.category || ""} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Marca" name="brand" value={form.brand || ""} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
                  </Grid>
                </Grid>

                <TextField
                  fullWidth size="small" label="Descripción" name="description" multiline rows={3}
                  value={form.description || ""} onChange={handleChange}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                />
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            {/* Inventario y Precios */}
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0', minHeight: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Package size={18} color="#64748b" strokeWidth={1.5} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Inventario y Precios</Typography>
              </Box>
              <Stack spacing={3}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth size="small" label="Precio principal" name="price" type="number" 
                      value={form.price ?? ""} onChange={handleChange}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                     <TextField
                      fullWidth size="small" label="Costo" name="cost" type="number" 
                      value={form.cost ?? ""} onChange={handleChange}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                    />
                  </Grid>
                </Grid>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Stock inicial" name="stock" type="number" value={form.stock ?? ""} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Cantidad mínima" name="minimumQuantity" type="number" value={form.minimumQuantity ?? ""} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Unidad de venta" name="saleUnit" value={form.saleUnit || ""} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} placeholder="Ej. Pieza" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Ubicación almacén" name="location" value={form.location || ""} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} placeholder="Pasillo A" />
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
                          control={<Checkbox size="small" name={field.name} checked={Boolean(form[field.name as keyof Product])} onChange={handleChange} sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#334155' } }} />}
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
                <FileText size={18} color="#64748b" strokeWidth={1.5} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Información Fiscal</Typography>
              </Box>
              <Stack spacing={3}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Clave SAT (Producto)" name="satKey" value={form.satKey || ""} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Clave SAT (Unidad)" name="satUnitKey" value={form.satUnitKey || ""} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
                  </Grid>
                </Grid>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth size="small" label="IVA (%)" name="iva" type="number" 
                      value={form.iva ?? ""} onChange={handleChange}
                      slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth size="small" label="IEPS (%)" name="ieps" type="number" 
                      value={form.ieps ?? ""} onChange={handleChange}
                      slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                    />
                  </Grid>
                </Grid>
                
                <FormControlLabel
                  control={<Checkbox size="small" name="ivaIncluded" checked={Boolean(form.ivaIncluded)} onChange={handleChange} sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#334155' } }} />}
                  label={<Typography variant="body2" sx={{ color: '#475569' }}>Precio incluye impuestos</Typography>}
                />
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Variantes */}
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <Tag size={18} color="#64748b" strokeWidth={1.5} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Variantes</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField size="small" label="Tipo (ej. Color)" value={newVariant.type} onChange={(e) => setNewVariant({ ...newVariant, type: e.target.value })} sx={{ minWidth: 200, "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
            <TextField size="small" label="Valor (ej. Rojo)" value={newVariant.value} onChange={(e) => setNewVariant({ ...newVariant, value: e.target.value })} sx={{ minWidth: 200, "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
            <Button variant="outlined" onClick={handleAddVariant} startIcon={<Plus size={18} strokeWidth={1.5} />} sx={{ borderRadius: 1.5, textTransform: 'none', color: '#16a34a', borderColor: '#16a34a', '&:hover': { bgcolor: '#f0fdf4' } }}>
              Agregar Variante
            </Button>
          </Box>
          <Stack spacing={1}>
            {variants.map((variant, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, px: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9' }}>
                <Typography variant="body2" sx={{ color: '#334155' }}><strong>{variant.type}:</strong> {variant.value}</Typography>
                <IconButton size="small" onClick={() => handleRemoveVariant(index)} sx={{ color: '#ef4444' }}><Trash2 size={16} strokeWidth={1.5} /></IconButton>
              </Box>
            ))}
            {variants.length === 0 && <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin variantes definidas</Typography>}
          </Stack>
        </Paper>

        {/* Listas de Precios */}
         <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <ListIcon size={18} color="#64748b" strokeWidth={1.5} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Listas de Precios Adicionales</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField size="small" label="Nombre (ej. Mayoreo)" value={newPriceList.name} onChange={(e) => setNewPriceList({ ...newPriceList, name: e.target.value })} sx={{ minWidth: 200, "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
            <TextField size="small" label="Precio" type="number" value={newPriceList.price} onChange={(e) => setNewPriceList({ ...newPriceList, price: Number(e.target.value) })} sx={{ minWidth: 200, "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
            <Button variant="outlined" onClick={handleAddPriceList} startIcon={<Plus size={18} strokeWidth={1.5} />} sx={{ borderRadius: 1.5, textTransform: 'none', color: '#16a34a', borderColor: '#16a34a', '&:hover': { bgcolor: '#f0fdf4' } }}>
              Agregar Lista
            </Button>
          </Box>
          <Stack spacing={1}>
            {priceLists.map((priceList, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, px: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9' }}>
                <Typography variant="body2" sx={{ color: '#334155' }}><strong>{priceList.name}:</strong> {formatCurrency(priceList.price)}</Typography>
                <IconButton size="small" onClick={() => handleRemovePriceList(index)} sx={{ color: '#ef4444' }}><Trash2 size={16} strokeWidth={1.5} /></IconButton>
              </Box>
            ))}
            {priceLists.length === 0 && <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin listas adicionales</Typography>}
          </Stack>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save size={18} strokeWidth={1.5} />}
            sx={{ px: 4, py: 1.5, borderRadius: 1.5, bgcolor: '#334155', '&:hover': { bgcolor: '#1e293b' }, textTransform: 'none', boxShadow: 'none' }}
          >
            {loading ? "Guardando..." : "Guardar Producto"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
