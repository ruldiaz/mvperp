"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  CircularProgress,
  InputAdornment,
  Divider,
  Stack,
  Checkbox,
  FormControlLabel,
  Grid,
} from "@mui/material";
import {
  UserPlus,
  User,
  Mail,
  Building2,
  FileText,
  Phone,
  Lock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    companyRfc: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "companyRfc" ? value.toUpperCase() : value,
    }));
  };

  const validateRfc = (rfc: string): boolean => {
    const cleanRfc = rfc.trim().toUpperCase();
    if (cleanRfc.length !== 12 && cleanRfc.length !== 13) return false;
    const rfcPattern = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{2}[A-Z0-9]?$/;
    return rfcPattern.test(cleanRfc);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (!acceptTerms) {
      toast.error("Debes aceptar los términos y condiciones");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (!validateRfc(formData.companyRfc)) {
      toast.error("RFC inválido. Debe tener 12 o 13 caracteres");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          password: formData.password,
          companyName: formData.companyName || formData.name || "Mi empresa",
          companyRfc: formData.companyRfc.trim().toUpperCase(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("¡Cuenta creada correctamente!");
        router.push("/dashboard");
      } else {
        toast.error(data.error || "Error en el registro");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f8fafc",
        py: 8,
        px: 3,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 600 }}>
        {/* Header / Logo */}
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1.5,
              mb: 2,
              textDecoration: "none",
              color: "inherit",
            }}
            component={Link}
            href="/"
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                bgcolor: "#334155",
                borderRadius: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldCheck color="white" size={24} strokeWidth={1.5} />
            </Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, color: "#1e293b", letterSpacing: "-0.02em" }}
            >
              MVP ERP
            </Typography>
          </Box>
          <Typography sx={{ color: "#64748b", fontSize: "0.95rem" }}>
            Crea tu cuenta y comienza a gestionar tu negocio
          </Typography>
        </Box>

        {/* Register Card */}
        <Paper
          variant="outlined"
          sx={{
            p: 5,
            borderRadius: 3,
            borderColor: "#e2e8f0",
            bgcolor: "white",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          }}
        >
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b", mb: 1 }}>
              Registro de Usuario
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              Complete el formulario para activar su suscripción
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Nombre Completo"
                    name="name"
                    size="small"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <User size={18} color="#94a3b8" />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Correo Electrónico"
                    name="email"
                    type="email"
                    size="small"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Mail size={18} color="#94a3b8" />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>INFORMACIÓN FISCAL</Typography>
              </Divider>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 7 }}>
                  <TextField
                    fullWidth
                    label="Nombre de la Empresa"
                    name="companyName"
                    size="small"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Building2 size={18} color="#94a3b8" />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField
                    fullWidth
                    label="RFC de la Empresa"
                    name="companyRfc"
                    size="small"
                    value={formData.companyRfc}
                    onChange={handleChange}
                    required
                    maxLength={13}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <FileText size={18} color="#94a3b8" />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Teléfono (Opcional)"
                name="phone"
                size="small"
                value={formData.phone}
                onChange={handleChange}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone size={18} color="#94a3b8" />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
              />

              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>SEGURIDAD</Typography>
              </Divider>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Contraseña"
                    name="password"
                    type="password"
                    size="small"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock size={18} color="#94a3b8" />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Confirmar Contraseña"
                    name="confirmPassword"
                    type="password"
                    size="small"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <ShieldCheck size={18} color="#94a3b8" />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                  />
                </Grid>
              </Grid>

              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#334155' } }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Acepto los <Box component="span" sx={{ color: '#334155', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>Términos y Condiciones</Box>
                  </Typography>
                }
              />

              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                fullWidth
                endIcon={!isLoading && <CheckCircle2 size={18} strokeWidth={1.5} />}
                sx={{
                  py: 1.5,
                  borderRadius: 1.5,
                  bgcolor: "#334155",
                  boxShadow: "none",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "#1e293b", boxShadow: "none" },
                }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : "Crear mi Cuenta"}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ my: 4, display: "flex", alignItems: "center" }}>
            <Divider sx={{ flex: 1 }} />
            <Typography variant="caption" sx={{ px: 2, color: "#94a3b8" }}>
              ¿YA TIENE CUENTA?
            </Typography>
            <Divider sx={{ flex: 1 }} />
          </Box>

          <Button
            fullWidth
            variant="outlined"
            component={Link}
            href="/login"
            sx={{
              py: 1.2,
              borderRadius: 1.5,
              borderColor: "#cbd5e1",
              color: "#475569",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { bgcolor: "#f8fafc", borderColor: "#94a3b8" },
            }}
          >
            Iniciar Sesión
          </Button>
        </Paper>

        {/* Links / Back */}
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Button
            component={Link}
            href="/"
            startIcon={<ArrowLeft size={16} />}
            sx={{
              color: "#64748b",
              textTransform: "none",
              fontSize: "0.875rem",
              "&:hover": { color: "#1e293b", bgcolor: "transparent" },
            }}
          >
            Volver al inicio
          </Button>
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 8, textAlign: "center" }}>
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
            © {new Date().getFullYear()} MVP ERP. Todos los derechos reservados.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
