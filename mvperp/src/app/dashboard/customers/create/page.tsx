// src/app/dashboard/customers/create/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Grid, 
  Stack, 
  Select, 
  MenuItem, 
  InputLabel, 
  FormControl, 
  CircularProgress, 
  Alert,
  Divider,
  Collapse,
  IconButton
} from "@mui/material";
import { 
  User, 
  FileText, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle,
  ArrowLeft,
  Save,
  X,
  CreditCard,
  Building2
} from "lucide-react";

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
        const errorData = await res.json().catch(() => ({}));
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
    <Box sx={{ maxWidth: 1000, mx: "auto", py: 4, px: { xs: 2, md: 3 }, animation: 'fadeIn 0.3s ease' }}>
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
            startIcon={<ArrowLeft size={18} color="#64748b" />}
            onClick={() => router.back()}
            sx={{ color: '#64748b', mb: 1.5, p: 0, '&:hover': { bgcolor: 'transparent', color: '#1e293b' }, textTransform: 'none' }}
          >
            Volver a clientes
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em' }}>
            Nuevo Cliente
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
            disabled={loading}
            onClick={handleSubmit}
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <Save size={18} strokeWidth={1.5} />}
            sx={{ borderRadius: 2, px: 4, py: 1, bgcolor: '#334155', '&:hover': { bgcolor: '#1e293b' }, textTransform: 'none', boxShadow: 'none' }}
          >
            {loading ? "Creando..." : "Guardar Cliente"}
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>{error}</Alert>
      )}

      {/* Form Content */}
      <Grid container spacing={3}>
        {/* Basic Info */}
        <Grid size={{ xs: 12 }}>
          <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Box sx={{ p: 1, bgcolor: '#f1f5f9', borderRadius: 1.5, display: 'flex' }}>
                <User size={18} color="#64748b" strokeWidth={1.5} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Información Básica</Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField 
                  fullWidth 
                  label="Nombre del Cliente" 
                  name="name" 
                  value={form.name} 
                  onChange={handleChange} 
                  required 
                  placeholder="Ej. Juan Pérez"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField 
                  fullWidth 
                  label="RFC" 
                  name="rfc" 
                  value={form.rfc} 
                  onChange={handleChange} 
                  required 
                  placeholder="XAXX010101000"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField 
                  fullWidth 
                  label="Razón Social (Nombre Fiscal)" 
                  name="razonSocial" 
                  value={form.razonSocial} 
                  onChange={handleChange} 
                  required 
                  placeholder="Ej. Juan Pérez Hernández"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField 
                  fullWidth 
                  label="Email" 
                  type="email" 
                  name="email" 
                  value={form.email} 
                  onChange={handleChange} 
                  placeholder="cliente@ejemplo.com"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField 
                  fullWidth 
                  label="Teléfono" 
                  name="phone" 
                  value={form.phone} 
                  onChange={handleChange} 
                  placeholder="55 1234 5678"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Fiscal Configuration */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Box sx={{ p: 1, bgcolor: '#f1f5f9', borderRadius: 1.5, display: 'flex' }}>
                <CreditCard size={18} color="#64748b" strokeWidth={1.5} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Configuración Fiscal</Typography>
            </Box>

            <Stack spacing={3}>
              <FormControl fullWidth required>
                <InputLabel>Uso de CFDI</InputLabel>
                <Select 
                  name="usoCFDI" 
                  value={form.usoCFDI} 
                  onChange={handleChange} 
                  label="Uso de CFDI"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="G01">G01 - Adquisición de mercancías</MenuItem>
                  <MenuItem value="G02">G02 - Devoluciones, descuentos o bonificaciones</MenuItem>
                  <MenuItem value="G03">G03 - Gastos en general</MenuItem>
                  <MenuItem value="I01">I01 - Construcciones</MenuItem>
                  <MenuItem value="I04">I04 - Equipo de cómputo y accesorios</MenuItem>
                  <MenuItem value="I08">I08 - Otra maquinaria y equipo</MenuItem>
                  <MenuItem value="S01">S01 - Sin efectos fiscales</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel>Régimen Fiscal</InputLabel>
                <Select 
                  name="taxRegime" 
                  value={form.taxRegime} 
                  onChange={handleChange} 
                  label="Régimen Fiscal"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="601">601 - General de Ley Personas Morales</MenuItem>
                  <MenuItem value="612">612 - Personas Físicas con Actividades Empresariales</MenuItem>
                  <MenuItem value="621">621 - Incorporación Fiscal</MenuItem>
                  <MenuItem value="626">626 - Régimen Simplificado de Confianza</MenuItem>
                  <MenuItem value="616">616 - Sin obligaciones fiscales</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Paper>
        </Grid>

        {/* Contact Address */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Box sx={{ p: 1, bgcolor: '#f1f5f9', borderRadius: 1.5, display: 'flex' }}>
                <Building2 size={18} color="#64748b" strokeWidth={1.5} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Dirección de Contacto</Typography>
            </Box>
            <TextField 
              fullWidth 
              label="Dirección" 
              name="address" 
              value={form.address} 
              onChange={handleChange} 
              multiline 
              rows={5} 
              placeholder="Calle, número, colonia, ciudad..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Paper>
        </Grid>

        {/* Detailed Fiscal Address */}
        <Grid size={{ xs: 12 }}>
          <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0', bgcolor: showFiscalInfo ? '#fff' : '#f8fafc' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1, bgcolor: '#f1f5f9', borderRadius: 1.5, display: 'flex' }}>
                  <MapPin size={18} color="#64748b" strokeWidth={1.5} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Domicilio Fiscal Completo</Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Información opcional para facturación detallada</Typography>
                </Box>
              </Box>
              <Button 
                onClick={() => setShowFiscalInfo(!showFiscalInfo)}
                endIcon={showFiscalInfo ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
                sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}
              >
                {showFiscalInfo ? 'Ocultar' : 'Configurar'}
              </Button>
            </Box>

            <Collapse in={showFiscalInfo}>
              <Box sx={{ pt: 4 }}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Calle" name="fiscalStreet" value={form.fiscalStreet} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField fullWidth label="No. Ext" name="fiscalExteriorNumber" value={form.fiscalExteriorNumber} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField fullWidth label="No. Int" name="fiscalInteriorNumber" value={form.fiscalInteriorNumber} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Colonia" name="fiscalNeighborhood" value={form.fiscalNeighborhood} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Código Postal" name="fiscalPostalCode" value={form.fiscalPostalCode} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Ciudad" name="fiscalCity" value={form.fiscalCity} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Estado" name="fiscalState" value={form.fiscalState} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          </Paper>
        </Grid>

        {/* Footer Actions */}
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
            <Button
              onClick={() => router.back()}
              variant="outlined"
              sx={{ borderRadius: 2, px: 4, py: 1.2, textTransform: 'none', borderColor: '#cbd5e1', color: '#475569' }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              onClick={handleSubmit}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save size={18} strokeWidth={1.5} />}
              sx={{ borderRadius: 2, px: 4, py: 1.2, textTransform: 'none', bgcolor: '#334155', '&:hover': { bgcolor: '#1e293b' }, boxShadow: 'none' }}
            >
              {loading ? "Registrando..." : "Crear Cliente"}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
