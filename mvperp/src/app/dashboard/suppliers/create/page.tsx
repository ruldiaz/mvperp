// src/app/dashboard/suppliers/create/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Supplier } from "@/types/supplier";
import { toast } from "react-hot-toast";
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  CircularProgress,
  Stack,
  InputAdornment,
  IconButton,
  Divider,
  Grid
} from "@mui/material";
import {
  ArrowLeft,
  Info,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Save,
  Globe
} from "lucide-react";

export default function CreateSupplier() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    contactName: "",
    phone: "",
    email: "",
    street: "",
    neighborhood: "",
    postalCode: "",
    city: "",
    state: "",
    municipality: "",
    rfc: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("El nombre del proveedor es obligatorio");
      return;
    }
    
    // Validación de RFC
    if (form.rfc && !/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(form.rfc)) {
      setError("El formato del RFC no es válido");
      toast.error("Formato de RFC inválido");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al crear proveedor");
      }

      toast.success("Proveedor creado exitosamente");
      router.push("/dashboard/suppliers");
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", py: 6, px: 3, animation: "fadeIn 0.3s ease" }}>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header (Exact Products Create Style) */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 6, flexWrap: "wrap", gap: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em', mb: 1 }}>
            Crear Proveedor
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.95rem' }}>
            Registra los datos fiscales y de contacto de tu nuevo proveedor
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
        
        {/* Información Principal */}
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <Building2 size={18} color="#64748b" strokeWidth={1.5} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Identificación de Empresa</Typography>
          </Box>
          
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth size="small" label="Nombre del Proveedor *" name="name"
                value={form.name} onChange={handleChange} required
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                placeholder="Ej. Distribuciones del Norte S.A."
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth size="small" label="RFC" name="rfc"
                value={form.rfc} onChange={handleChange}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                placeholder="XAXX010101000"
              />
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            {/* Contacto */}
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0', minHeight: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <User size={18} color="#64748b" strokeWidth={1.5} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Datos de Contacto</Typography>
              </Box>
              <Stack spacing={3}>
                <TextField
                  fullWidth size="small" label="Nombre del representante" name="contactName"
                  value={form.contactName} onChange={handleChange}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                  placeholder="Ej. Lic. Armando Casas"
                />
                <TextField
                  fullWidth size="small" label="Teléfono" name="phone"
                  value={form.phone} onChange={handleChange}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><Phone size={18} color="#64748b" /></InputAdornment> } }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                />
                <TextField
                  fullWidth size="small" label="Correo electrónico" name="email" type="email"
                  value={form.email} onChange={handleChange}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><Mail size={18} color="#64748b" /></InputAdornment> } }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                  placeholder="proveedor@empresa.com"
                />
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            {/* Ubicación */}
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0', minHeight: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <MapPin size={18} color="#64748b" strokeWidth={1.5} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Domicilio</Typography>
              </Box>
              <Stack spacing={3}>
                <TextField
                  fullWidth size="small" label="Calle y Número" name="street"
                  value={form.street} onChange={handleChange}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Colonia" name="neighborhood" value={form.neighborhood} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Código Postal" name="postalCode" value={form.postalCode} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
                  </Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Ciudad" name="city" value={form.city} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Estado" name="state" value={form.state} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
                  </Grid>
                </Grid>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save size={18} strokeWidth={1.5} />}
            sx={{ px: 4, py: 1.5, borderRadius: 1.5, bgcolor: '#334155', '&:hover': { bgcolor: '#1e293b' }, textTransform: 'none', boxShadow: 'none' }}
          >
            {loading ? "Guardando..." : "Guardar Proveedor"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
