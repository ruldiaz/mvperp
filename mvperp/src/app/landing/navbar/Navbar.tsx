// src/app/landing/navbar/Navbar.tsx
"use client";
import Link from "next/link";
import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Menu,
  MenuItem,
  IconButton,
} from "@mui/material";
import {
  ShieldCheck,
  ChevronDown,
  LayoutDashboard,
  Receipt,
  Package,
  Store,
  Tag,
  Users,
  Building2,
  Rocket,
  Menu as MenuIcon,
} from "lucide-react";

export default function Navbar() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpenFunc = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseFunc = () => {
    setAnchorEl(null);
  };

  const funcionalidades = [
    { nombre: "Punto de Venta", href: "#punto-venta", icon: <Store size={18} /> },
    { nombre: "Facturación", href: "#facturacion", icon: <Receipt size={18} /> },
    { nombre: "Inventario", href: "#inventario", icon: <Package size={18} /> },
    { nombre: "Tienda en Línea", href: "#tienda-linea", icon: <LayoutDashboard size={18} /> },
  ];

  const navigationItems = [
    { nombre: "Precios", href: "#precios" },
    { nombre: "Distribuidores", href: "#distribuidores" },
    { nombre: "Compañía", href: "#compania" },
  ];

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid #e2e8f0",
        color: "#1e293b",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
          {/* Logo */}
          <Box
            component={Link}
            href="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                bgcolor: "#334155",
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldCheck color="white" size={20} strokeWidth={1.5} />
            </Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              MVP ERP
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1 }}>
            <Button
              endIcon={<ChevronDown size={16} />}
              onClick={handleOpenFunc}
              sx={{
                color: "#475569",
                textTransform: "none",
                fontWeight: 600,
                px: 2,
                "&:hover": { bgcolor: "#f1f5f9" },
              }}
            >
              Funcionalidades
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleCloseFunc}
              elevation={3}
              sx={{
                "& .MuiPaper-root": {
                  borderRadius: 2,
                  mt: 1,
                  minWidth: 220,
                  border: "1px solid #e2e8f0",
                },
              }}
            >
              {funcionalidades.map((item) => (
                <MenuItem
                  key={item.href}
                  onClick={handleCloseFunc}
                  component={Link}
                  href={item.href}
                  sx={{
                    py: 1.5,
                    gap: 1.5,
                    color: "#475569",
                    "&:hover": { bgcolor: "#f8fafc", color: "#1e293b" },
                  }}
                >
                  <Box sx={{ color: "#94a3b8" }}>{item.icon}</Box>
                  <Typography variant="body2" fontWeight={500}>
                    {item.nombre}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>

            {navigationItems.map((item) => (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                sx={{
                  color: "#475569",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2,
                  "&:hover": { bgcolor: "#f1f5f9" },
                }}
              >
                {item.nombre}
              </Button>
            ))}

            <Box sx={{ ml: 2, display: "flex", gap: 1.5 }}>
              <Button
                component={Link}
                href="/login"
                sx={{
                  color: "#475569",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                }}
              >
                Ingresar
              </Button>
              <Button
                component={Link}
                href="/register"
                variant="contained"
                sx={{
                  bgcolor: "#334155",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  borderRadius: 1.5,
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#1e293b", boxShadow: "none" },
                }}
              >
                Comenzar gratis
              </Button>
            </Box>
          </Box>

          {/* Mobile Menu Icon */}
          <IconButton
            sx={{ display: { xs: "flex", md: "none" }, color: "#475569" }}
          >
            <MenuIcon size={24} />
          </IconButton>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
