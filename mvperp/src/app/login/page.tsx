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
} from "@mui/material";
import {
  LogIn,
  Mail,
  Lock,
  UserPlus,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("¡Ingreso exitoso!");
        router.push("/dashboard");
      } else {
        toast.error(data.error || "Error en login");
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
        p: 3,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 400 }}>
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
            Sistema de Gestión Empresarial
          </Typography>
        </Box>

        {/* Login Card */}
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            borderRadius: 3,
            borderColor: "#e2e8f0",
            bgcolor: "white",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: "#1e293b", mb: 1 }}
            >
              Iniciar Sesión
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              Ingrese sus credenciales para acceder al sistema
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Correo Electrónico"
                variant="outlined"
                size="small"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

              <Box>
                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 0.5 }}>
                  <Button
                    component={Link}
                    href="/forgot-password"
                    sx={{
                      fontSize: "0.75rem",
                      textTransform: "none",
                      color: "#64748b",
                      p: 0,
                      minWidth: "auto",
                      "&:hover": { bgcolor: "transparent", color: "#1e293b" },
                    }}
                  >
                    ¿Olvidó su contraseña?
                  </Button>
                </Box>
                <TextField
                  fullWidth
                  label="Contraseña"
                  variant="outlined"
                  size="small"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              </Box>

              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                fullWidth
                endIcon={!isLoading && <LogIn size={18} strokeWidth={1.5} />}
                sx={{
                  py: 1.2,
                  borderRadius: 1.5,
                  bgcolor: "#334155",
                  boxShadow: "none",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "#1e293b", boxShadow: "none" },
                }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : "Ingresar"}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ my: 4, display: "flex", alignItems: "center" }}>
            <Divider sx={{ flex: 1 }} />
            <Typography variant="caption" sx={{ px: 2, color: "#94a3b8" }}>
              O CONTINUAR CON
            </Typography>
            <Divider sx={{ flex: 1 }} />
          </Box>

          <Button
            fullWidth
            variant="outlined"
            onClick={() => router.push("/register")}
            startIcon={<UserPlus size={18} strokeWidth={1.5} />}
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
            Crear cuenta nueva
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
