// src/app/landing/page.tsx
"use client";

import Link from "next/link";
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Divider,
  Stack,
  alpha,
  Grid,
} from "@mui/material";
import {
  Store,
  Receipt,
  Package,
  LayoutDashboard,
  Tag,
  Users,
  Building2,
  Rocket,
  ArrowRight,
  CheckCircle2,
  ChevronUp,
} from "lucide-react";

export default function LandingPage() {
  const sections = [
    {
      id: "punto-venta",
      title: "Punto de Venta",
      content: "Sistema de punto de venta avanzado diseñado para optimizar la velocidad y precisión de sus transacciones comerciales diarias.",
      icon: <Store size={32} strokeWidth={1.5} />,
      features: ["Venta rápida", "Gestión de cajas", "Múltiples métodos de pago"],
    },
    {
      id: "facturacion",
      title: "Facturación",
      content: "Emisión de facturas electrónicas 100% compatible con las últimas normativas fiscales, simplificando su cumplimiento tributario.",
      icon: <Receipt size={32} strokeWidth={1.5} />,
      features: ["CFDI 4.0", "Cancelaciones automáticas", "Timbrado ilimitado"],
    },
    {
      id: "inventario",
      title: "Inventario",
      content: "Control exhaustivo de existencias en tiempo real con alertas proactivas para evitar rupturas de stock y optimizar su capital.",
      icon: <Package size={32} strokeWidth={1.5} />,
      features: ["Alertas de stock bajo", "Multialmacén", "Kardex de productos"],
    },
    {
      id: "tienda-linea",
      title: "Tienda en Línea",
      content: "Expanda su mercado con una plataforma de e-commerce sincronizada nativamente con su inventario y catálogo central.",
      icon: <LayoutDashboard size={32} strokeWidth={1.5} />,
      features: ["Sincronización total", "Diseño responsivo", "Pasarelas de pago"],
    },
    {
      id: "precios",
      title: "Planes y Precios",
      content: "Estructuras de costos transparentes y escalables, diseñadas para crecer junto con su organización sin costos ocultos.",
      icon: <Tag size={32} strokeWidth={1.5} />,
      features: ["Plan Básico", "Plan Profesional", "Plan Enterprise"],
    },
    {
      id: "distribuidores",
      title: "Programa de Partners",
      content: "Únase a nuestra red de distribuidores autorizados y acceda a beneficios exclusivos mientras ayuda a otras empresas a digitalizarse.",
      icon: <Users size={32} strokeWidth={1.5} />,
      features: ["Comisiones atractivas", "Capacitación técnica", "Soporte prioritario"],
    },
    {
      id: "compania",
      title: "Nuestra Compañía",
      content: "Trayectoria de innovación constante en el desarrollo de soluciones tecnológicas robustas para el sector empresarial.",
      icon: <Building2 size={32} strokeWidth={1.5} />,
      features: ["Misión y Visión", "Valores corporativos", "Equipo experto"],
    },
    {
      id: "soluciones",
      title: "Soluciones a Medida",
      content: "Desarrollo de módulos específicos y personalizaciones que se adaptan a los flujos de trabajo únicos de su sector industrial.",
      icon: <Rocket size={32} strokeWidth={1.5} />,
      features: ["Consultoría técnica", "API abierta", "Integraciones ERP"],
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fcfcfd" }}>
      <title>MVP ERP | Gestión Empresarial Inteligente</title>

      {/* Hero Section */}
      <Box
        id="landing-top"
        sx={{
          pt: { xs: 10, md: 16 },
          pb: { xs: 8, md: 12 },
          textAlign: "center",
          bgcolor: "#334155",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            background: "radial-gradient(circle at 50% 50%, #ffffff 0%, transparent 70%)",
          }}
        />
        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              mb: 3,
              letterSpacing: "-0.03em",
              fontSize: { xs: "2.5rem", md: "3.75rem" },
            }}
          >
            Gestión Empresarial Profesional y Simplificada
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: "#cbd5e1",
              mb: 6,
              fontWeight: 400,
              maxWidth: "700px",
              mx: "auto",
              lineHeight: 1.6,
            }}
          >
            Optimice cada proceso de su negocio con nuestra plataforma ERP modular de alto rendimiento.
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ 
              justifyContent: "center",
              alignItems: "center",
              gap: 2
            }}
          >
            <Button
              href="#funcionalidades"
              variant="contained"
              size="large"
              sx={{
                bgcolor: "white",
                color: "#334155",
                fontWeight: 700,
                textTransform: "none",
                px: 4,
                py: 1.5,
                borderRadius: 2,
                "&:hover": { bgcolor: "#f1f5f9" },
              }}
            >
              Explorar Funciones
            </Button>
            <Button
              href="/register"
              variant="outlined"
              size="large"
              sx={{
                borderColor: "rgba(255,255,255,0.3)",
                color: "white",
                fontWeight: 600,
                textTransform: "none",
                px: 4,
                py: 1.5,
                borderRadius: 2,
                "&:hover": { borderColor: "white", bgcolor: "rgba(255,255,255,0.05)" },
              }}
            >
              Comenzar Ahora
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Features Grid */}
      <Container maxWidth="lg" sx={{ py: 12 }} id="funcionalidades">
        <Grid container spacing={4}>
          {sections.map((section) => (
            <Grid key={section.id} size={{ xs: 12, md: 6 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 5,
                  height: "100%",
                  borderRadius: 3,
                  borderColor: "#e2e8f0",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    borderColor: "#94a3b8",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "#f8fafc",
                      color: "#475569",
                      border: "1px solid #f1f5f9",
                    }}
                  >
                    {section.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>
                        {section.title}
                      </Typography>
                      <Button
                        href="#landing-top"
                        size="small"
                        startIcon={<ChevronUp size={14} />}
                        sx={{ color: "#94a3b8", textTransform: "none", fontSize: "0.75rem", minWidth: "auto", p: 0.5 }}
                      >
                        Top
                      </Button>
                    </Box>
                    <Typography sx={{ color: "#64748b", mb: 4, lineHeight: 1.6 }}>
                      {section.content}
                    </Typography>
                    
                    <Box sx={{ bgcolor: "#f8fafc", p: 3, borderRadius: 2, border: "1px solid #f1f5f9" }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", mb: 2, display: "block" }}>
                        Características Clave
                      </Typography>
                      <Grid container spacing={1.5}>
                        {section.features.map((feature, idx) => (
                          <Grid key={idx} size={{ xs: 12, sm: 6 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <CheckCircle2 size={14} color="#64748b" />
                              <Typography variant="body2" sx={{ color: "#475569", fontWeight: 500 }}>
                                {feature}
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Footer / Quick Links */}
      <Box sx={{ bgcolor: "#0f172a", color: "white", py: 10 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 6, textAlign: "center" }}>
            Ecosistema de Soluciones MVP
          </Typography>
          <Grid container spacing={3} sx={{ mb: 8 }}>
            {sections.slice(0, 4).map((section) => (
              <Grid key={section.id} size={{ xs: 6, md: 3 }}>
                <Box
                  component="a"
                  href={`#${section.id}`}
                  sx={{
                    display: "block",
                    p: 3,
                    borderRadius: 2,
                    border: "1px solid rgba(255,255,255,0.1)",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "all 0.2s",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.05)",
                      borderColor: "rgba(255,255,255,0.3)",
                    },
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {section.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                    Ver documentación →
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
          
          <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 6 }} />
          
          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", alignItems: "center", gap: 4 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                MVP ERP
              </Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                © {new Date().getFullYear()} Soluciones Tecnológicas de Vanguardia.
              </Typography>
            </Box>
            <Button
              component={Link}
              href="/login"
              variant="contained"
              endIcon={<ArrowRight size={18} />}
              sx={{
                bgcolor: "#3b82f6",
                px: 5,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 700,
                fontSize: "1rem",
                "&:hover": { bgcolor: "#2563eb" },
              }}
            >
              Comience su Transformación Digital
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
