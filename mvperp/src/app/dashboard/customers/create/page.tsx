// src/app/dashboard/customers/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { 
  Box, Typography, Paper, TextField, Button, Grid, Stack, Select, MenuItem, InputLabel, FormControl, CircularProgress, Alert
} from "@mui/material";
import { User, FileText, MapPin, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

export default function CreateCustomer() {
  const [form, setForm] = useState({
    name: "", razonSocial: "", email: "", phone: "", address: "", rfc: "",
    usoCFDI: "", taxRegime: "", fiscalAddress: "", fiscalStreet: "", fiscalExteriorNumber: "",
    fiscalInteriorNumber: "", fiscalNeighborhood: "", fiscalPostalCode: "", fiscalCity: "",
    fiscalState: "", fiscalMunicipality: "", fiscalCountry: "México",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFiscalInfo, setShowFiscalInfo] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.razonSocial.trim() || !form.rfc.trim()) {
      toast.error("Los campos Nombre, Razón Social y RFC son obligatorios");
      return;
    }
    if (!form.usoCFDI || !form.taxRegime) {
      toast.error("Los campos Uso de CFDI y Régimen Fiscal son obligatorios");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al crear cliente");
      }

      const data = await res.json();
      toast.success("Cliente creado exitosamente");
      router.push(`/dashboard/customers/${data.customer.id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Error al crear el cliente";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: any) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', pb: 8 }}>
      {/* Hero Section */}
      <Box sx={{ pt: 6, pb: 6, px: 4, bgcolor: '#0f172a', color: 'white', borderRadius: '0 0 24px 24px', mb: 4, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
           <Stack spacing={3} sx={{ flexDirection: { xs: 'column', md: 'row' }, justifyContent: "space-between", alignItems: { xs: 'flex-start', md: 'center' } }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.5px' }}>Nuevo Cliente</Typography>
              <Typography variant="h6" sx={{ color: '#94a3b8', fontWeight: 400 }}>Agrega un nuevo cliente a tu sistema</Typography>
            </Box>
            <Button
              component={Link}
              href="/dashboard/customers"
              variant="outlined"
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', fontWeight: 600, px: 3, py: 1.5, borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: 'white' }, textTransform: 'none', fontSize: '1rem' }}
            >
              Volver
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Form Content */}
      <Box sx={{ maxWidth: 1000, mx: 'auto', px: 4 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            
            {error && (
              <Alert severity="error" icon={<AlertTriangle />} sx={{ borderRadius: 2 }}>{error}</Alert>
            )}

            {/* Información Básica */}
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <User size={18} color="#64748b" strokeWidth={1.5} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Información Básica</Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                   <TextField fullWidth label="Nombre del Cliente *" name="name" value={form.name} onChange={handleChange} required variant="outlined" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                   <TextField fullWidth label="Razón Social (Nombre Fiscal) *" name="razonSocial" value={form.razonSocial} onChange={handleChange} required variant="outlined" placeholder="Razón social para facturación" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                   <TextField fullWidth label="Email" type="email" name="email" value={form.email} onChange={handleChange} variant="outlined" placeholder="cliente@ejemplo.com" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                   <TextField fullWidth label="Teléfono" type="tel" name="phone" value={form.phone} onChange={handleChange} variant="outlined" placeholder="+52 123 456 7890" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                   <TextField fullWidth label="Dirección de Contacto" name="address" value={form.address} onChange={handleChange} multiline rows={2} variant="outlined" placeholder="Calle, número, colonia, ciudad..." />
                </Grid>
              </Grid>
            </Paper>

            {/* Información Fiscal */}
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <FileText size={18} color="#64748b" strokeWidth={1.5} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Información Fiscal Obligatoria</Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                   <TextField fullWidth label="RFC *" name="rfc" value={form.rfc} onChange={handleChange} required variant="outlined" placeholder="XAXX010101000" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                   <FormControl fullWidth required>
                      <InputLabel>Uso de CFDI</InputLabel>
                      <Select name="usoCFDI" value={form.usoCFDI} onChange={handleChange} label="Uso de CFDI">
                         <MenuItem value=""><em>Seleccionar uso</em></MenuItem>
                         <MenuItem value="G01">G01 - Adquisición de mercancías</MenuItem>
                         <MenuItem value="G02">G02 - Devoluciones, descuentos o bonificaciones</MenuItem>
                         <MenuItem value="G03">G03 - Gastos en general</MenuItem>
                         <MenuItem value="I01">I01 - Construcciones</MenuItem>
                         <MenuItem value="I04">I04 - Equipo de cómputo y accesorios</MenuItem>
                         <MenuItem value="I08">I08 - Otra maquinaria y equipo</MenuItem>
                         <MenuItem value="S01">S01 - Sin efectos fiscales</MenuItem>
                      </Select>
                   </FormControl>
                </Grid>
                <Grid size={{ xs: 12 }}>
                   <FormControl fullWidth required>
                      <InputLabel>Régimen Fiscal</InputLabel>
                      <Select name="taxRegime" value={form.taxRegime} onChange={handleChange} label="Régimen Fiscal">
                         <MenuItem value=""><em>Seleccionar régimen</em></MenuItem>
                         <MenuItem value="601">601 - General de Ley Personas Morales</MenuItem>
                         <MenuItem value="612">612 - Personas Físicas con Actividades Empresariales</MenuItem>
                         <MenuItem value="621">621 - Incorporación Fiscal</MenuItem>
                         <MenuItem value="626">626 - Régimen Simplificado de Confianza</MenuItem>
                         <MenuItem value="616">616 - Sin obligaciones fiscales</MenuItem>
                      </Select>
                   </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {/* Domicilio Fiscal */}
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0' }}>
               <Stack spacing={0} sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", mb: showFiscalInfo ? 4 : 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <MapPin size={18} color="#64748b" strokeWidth={1.5} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Domicilio Fiscal Completo (Opcional)</Typography>
                  </Box>
                  <Button 
                    onClick={() => setShowFiscalInfo(!showFiscalInfo)}
                    endIcon={showFiscalInfo ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    sx={{ textTransform: 'none', color: '#64748b' }}
                  >
                     {showFiscalInfo ? 'Ocultar' : 'Mostrar'}
                  </Button>
               </Stack>

               {showFiscalInfo && (
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                       <TextField fullWidth label="Calle" name="fiscalStreet" value={form.fiscalStreet} onChange={handleChange} variant="outlined" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                       <TextField fullWidth label="No. Exterior" name="fiscalExteriorNumber" value={form.fiscalExteriorNumber} onChange={handleChange} variant="outlined" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                       <TextField fullWidth label="No. Interior" name="fiscalInteriorNumber" value={form.fiscalInteriorNumber} onChange={handleChange} variant="outlined" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                       <TextField fullWidth label="Colonia" name="fiscalNeighborhood" value={form.fiscalNeighborhood} onChange={handleChange} variant="outlined" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                       <TextField fullWidth label="Código Postal" name="fiscalPostalCode" value={form.fiscalPostalCode} onChange={handleChange} variant="outlined" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                       <TextField fullWidth label="Ciudad" name="fiscalCity" value={form.fiscalCity} onChange={handleChange} variant="outlined" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                       <TextField fullWidth label="Municipio/Alcaldía" name="fiscalMunicipality" value={form.fiscalMunicipality} onChange={handleChange} variant="outlined" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                       <TextField fullWidth label="Estado" name="fiscalState" value={form.fiscalState} onChange={handleChange} variant="outlined" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                       <TextField fullWidth label="País" name="fiscalCountry" value={form.fiscalCountry} onChange={handleChange} variant="outlined" />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                       <TextField fullWidth label="Domicilio Completo" name="fiscalAddress" value={form.fiscalAddress} onChange={handleChange} multiline rows={2} variant="outlined" />
                    </Grid>
                  </Grid>
               )}
            </Paper>

            <Stack spacing={2} sx={{ flexDirection: "row", justifyContent: "flex-end", pt: 2 }}>
              <Button
                component={Link}
                href="/dashboard/customers"
                variant="outlined"
                sx={{ borderRadius: 2, textTransform: 'none', color: '#64748b', borderColor: '#cbd5e1' }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{ borderRadius: 2, textTransform: 'none', bgcolor: '#0f172a', boxShadow: 0, '&:hover': { bgcolor: '#1e293b', boxShadow: 0 } }}
              >
                {loading ? "Creando..." : "Crear Cliente"}
              </Button>
            </Stack>

          </Stack>
        </form>
      </Box>
    </Box>
  );
}
