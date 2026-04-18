// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Divider,
  alpha,
  Grid,
} from "@mui/material";
import {
  DollarSign,
  Package,
  CheckCircle,
  TrendingUp,
  Plus,
  User,
  FileText,
  BarChart3,
  FileEdit,
  ShoppingBag,
  PackagePlus,
  Users,
  Clock,
  ArrowRight,
} from "lucide-react";

interface UserInfo {
  id: string;
  email: string;
  name?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    activeProducts: 0,
    pendingTasks: 0,
    revenue: 0,
  });

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        router.push("/login");
      }
    };
    fetchUser();
    setTimeout(() => {
      setStats({
        totalSales: 1245,
        activeProducts: 89,
        pendingTasks: 12,
        revenue: 25489.5,
      });
    }, 500);
  }, [router]);

  if (!user) return null;

  return (
    <Box sx={{ animation: "fadeIn 0.5s ease" }}>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Welcome Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 6, flexWrap: "wrap", gap: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#1e293b", letterSpacing: "-0.02em", mb: 1 }}>
            ¡Bienvenido, <Box component="span" sx={{ color: "#334155" }}>{user.name || user.email.split("@")[0]}</Box>!
          </Typography>
          <Typography variant="body1" sx={{ color: "#64748b" }}>
            Resumen operativo para hoy, {new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} color="#ffffff" />}
          sx={{
            bgcolor: "#334155",
            color: "white",
            px: 3,
            py: 1.2,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 700,
            boxShadow: "none",
            "&:hover": { bgcolor: "#1e293b", boxShadow: "none" },
          }}
        >
          Nueva Venta
        </Button>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {[
          { title: "Ventas Totales", value: stats.totalSales, change: "+12.5%", icon: <DollarSign size={18} color="#64748b" />, color: "#3b82f6" },
          { title: "Productos Activos", value: stats.activeProducts, change: "+2.1%", icon: <Package size={18} color="#64748b" />, color: "#10b981" },
          { title: "Tareas Pendientes", value: stats.pendingTasks, change: "-1", icon: <CheckCircle size={18} color="#64748b" />, color: "#f59e0b" },
          { title: "Ingresos (MXN)", value: `$${stats.revenue.toLocaleString("es-MX")}`, change: "+18.4%", icon: <TrendingUp size={18} color="#64748b" />, color: "#8b5cf6" },
        ].map((stat, idx) => (
          <Grid key={idx} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: "#e2e8f0", transition: "all 0.2s", "&:hover": { borderColor: "#94a3b8" } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.title}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#1e293b", mt: 0.5 }}>{stat.value}</Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(stat.color, 0.1), color: stat.color }}>{stat.icon}</Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: stat.change.startsWith("+") ? "#166534" : "#991b1b", bgcolor: stat.change.startsWith("+") ? "#dcfce7" : "#fee2e2", px: 1, py: 0.2, borderRadius: 1 }}>
                  {stat.change}
                </Typography>
                <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 500 }}>vs. mes anterior</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* Main Activity */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper variant="outlined" sx={{ borderRadius: 3, borderColor: "#e2e8f0", overflow: "hidden" }}>
            <Box sx={{ p: 3, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#f8fafc" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1e293b" }}>Actividad Reciente</Typography>
              <Button size="small" endIcon={<ArrowRight size={18} color="#64748b" />} sx={{ textTransform: "none", color: "#64748b" }}>Ver Historial</Button>
            </Box>
            <Divider />
            <Box>
              {[
                { user: "Juan Pérez", action: "creó una nueva cotización", time: "Hace 2 horas", icon: <FileEdit size={18} color="#64748b" /> },
                { user: "María García", action: "realizó una venta de $1,250", time: "Hace 4 horas", icon: <ShoppingBag size={18} color="#64748b" /> },
                { user: "Pedro López", action: "actualizó el inventario", time: "Hace 6 horas", icon: <Package size={18} color="#64748b" /> },
                { user: "Ana Martínez", action: "agregó un nuevo cliente", time: "Hace 1 día", icon: <Users size={18} color="#64748b" /> },
              ].map((item, idx) => (
                <Box key={idx} sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2.5, "&:hover": { bgcolor: "#fcfcfd" }, borderBottom: idx < 3 ? "1px solid #f1f5f9" : "none" }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                    {item.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ color: "#1e293b" }}>
                      <Box component="span" sx={{ fontWeight: 700 }}>{item.user}</Box> {item.action}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: 0.5, mt: 0.2 }}>
                      <Clock size={18} color="#64748b" /> {item.time}
                    </Typography>
                  </Box>
                  <Button variant="text" size="small" sx={{ textTransform: "none", color: "#475569", fontWeight: 600 }}>Detalles</Button>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1e293b", mb: 2, px: 1 }}>Accesos Directos</Typography>
          <Stack spacing={2}>
            {[
              { label: "Catálogo de Productos", icon: <PackagePlus size={18} color="#64748b" />, path: "/dashboard/products", color: "#3b82f6" },
              { label: "Gestión de Clientes", icon: <User size={18} color="#64748b" />, path: "/dashboard/customers", color: "#10b981" },
              { label: "Facturación CFDI", icon: <FileText size={18} color="#64748b" />, path: "/dashboard/invoices", color: "#8b5cf6" },
              { label: "Reportes de Venta", icon: <BarChart3 size={18} color="#64748b" />, path: "/dashboard/reports", color: "#f59e0b" },
            ].map((action, idx) => (
              <Paper
                key={idx}
                component={Link}
                href={action.path}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  textDecoration: "none",
                  transition: "all 0.2s",
                  "&:hover": { bgcolor: alpha(action.color, 0.04), borderColor: action.color, transform: "translateX(4px)" }
                }}
              >
                <Box sx={{ color: "#64748b" }}>{action.icon}</Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#475569", flex: 1 }}>{action.label}</Typography>
                <ArrowRight size={18} color="#64748b" />
              </Paper>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
