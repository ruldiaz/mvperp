// src/app/dashboard/invoices/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Invoice } from "@/types/invoice";
import { toast } from "react-hot-toast";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  CircularProgress,
  Pagination,
  Grid,
  Tooltip,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Fade,
  Divider,
  TextField
} from "@mui/material";
import {
  Search,
  Plus,
  Eye,
  FileText,
  Calendar,
  User,
  Filter,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  CreditCard,
  FileDigit,
  Download,
  MoreVertical,
  History
} from "lucide-react";

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1, limit: 10, totalCount: 0, totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  // Menu State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  const fetchInvoices = useCallback(async (page = 1, search = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
      });

      const res = await fetch(`/api/invoices?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar las facturas");

      const data = await res.json();
      setInvoices(data.invoices);
      setPagination(data.pagination);
      setError("");
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las facturas");
      toast.error("Error al cargar facturas");
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchInvoices(1, searchTerm);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchInvoices]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    fetchInvoices(value, searchTerm);
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "stamped":
        return { label: "Timbrada", color: "#10b981", bgcolor: "#f0fdf4", icon: <CheckCircle2 size={18} color="#64748b" /> };
      case "cancelled":
        return { label: "Cancelada", color: "#ef4444", bgcolor: "#fef2f2", icon: <XCircle size={18} color="#64748b" /> };
      default:
        return { label: "Pendiente", color: "#f59e0b", bgcolor: "#fffbeb", icon: <Clock size={18} color="#64748b" /> };
    }
  };

  const calculateTotals = () => {
    let totals = { amount: 0, stamped: 0, pending: 0 };
    invoices.forEach(inv => {
      const total = (inv.subtotal || 0) + (inv.taxes || 0);
      totals.amount += total;
      if (inv.status === "stamped") totals.stamped++;
      else if (inv.status === "pending") totals.pending++;
    });
    return totals;
  };

  const summary = calculateTotals();

  if (loading && invoices.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Stack sx={{ alignItems: 'center' }} spacing={2}>
          <CircularProgress size={32} sx={{ color: '#334155' }} />
          <Typography sx={{ color: '#64748b', fontWeight: 500 }}>Cargando facturas...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", py: 6, px: 3, animation: "fadeIn 0.3s ease" }}>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header Section (Products Page Style) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 6, flexWrap: 'wrap', gap: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em', mb: 1 }}>
            Facturas
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.95rem' }}>
            Gestión y generación de comprobantes fiscales CFDI 4.0
          </Typography>
        </Box>
        <Box>
          <Button
            variant="contained"
            onClick={handleOpenMenu}
            startIcon={<Plus size={18} strokeWidth={2} color="#64748b" />}
            endIcon={<ChevronDown size={18} color="#64748b" />}
            sx={{
              bgcolor: '#334155',
              '&:hover': { bgcolor: '#1e293b' },
              textTransform: 'none',
              borderRadius: 1.5,
              px: 3,
              py: 1.2,
              boxShadow: 'none',
              fontWeight: 600
            }}
          >
            Nueva Factura
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleCloseMenu}
            sx={{ mt: 1 }}
            slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 200, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' } } }}
          >
            <MenuItem onClick={() => { handleCloseMenu(); router.push('/dashboard/invoices/create'); }}>
              <ListItemIcon><FileDigit size={18} /></ListItemIcon>
              <ListItemText primary="Factura Directa" secondary="Crear desde cero" />
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { handleCloseMenu(); router.push('/dashboard/sales'); }}>
              <ListItemIcon><TrendingUp size={18} /></ListItemIcon>
              <ListItemText primary="Facturar Venta" secondary="Desde historial de ventas" />
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'TOTAL FACTURADO', value: formatCurrency(summary.amount), icon: <CreditCard size={18} color="#64748b" /> },
          { label: 'TIMBRADAS', value: pagination.totalCount, icon: <CheckCircle2 size={18} color="#64748b" /> },
          { label: 'PENDIENTES', value: summary.pending, icon: <Clock size={18} color="#64748b" /> },
        ].map((stat, i) => (
          <Grid key={i} size={{ xs: 12, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, borderColor: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', display: 'flex' }}>
                {stat.icon}
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {stat.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {stat.value}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Filters Bar (Products Page Style) */}
      <Paper variant="outlined" sx={{ p: 2, mb: 4, borderRadius: 2, borderColor: '#e2e8f0', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <TextField
          size="small"
          placeholder="Buscar por folio, cliente, RFC..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="#64748b" />
                </InputAdornment>
              ),
            }
          }}
          sx={{ width: { xs: '100%', md: 400 }, "& .MuiOutlinedInput-root": { borderRadius: 1.5, bgcolor: '#f8fafc' } }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
           <Button 
            variant="outlined" 
            startIcon={<Filter size={18} color="#64748b" />}
            sx={{ borderRadius: 1.5, textTransform: 'none', px: 3, py: 0.8, borderColor: '#cbd5e1', color: '#475569', '&:hover': { bgcolor: '#f1f5f9', borderColor: '#94a3b8' } }}
          >
            Filtros
          </Button>
        </Box>
      </Paper>

      {/* Table Section */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, borderColor: '#e2e8f0', overflow: 'hidden' }}>
        <Table sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2, textTransform: 'uppercase' }}>FACTURA / FOLIO</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2, textTransform: 'uppercase' }}>FECHA</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2, textTransform: 'uppercase' }}>CLIENTE</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2, textTransform: 'uppercase' }}>TOTAL</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2, textTransform: 'uppercase' }}>ESTADO</TableCell>
              <TableCell align="right" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2, textTransform: 'uppercase' }}>ACCIONES</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                  <Stack sx={{ alignItems: 'center', opacity: 0.5 }} spacing={2}>
                    <FileText size={18} strokeWidth={1} color="#64748b" />
                    <Typography>No se encontraron facturas</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => {
                const status = getStatusConfig(inv.status);
                const total = (inv.subtotal || 0) + (inv.taxes || 0);
                return (
                  <TableRow key={inv.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell>
                      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: '#f1f5f9', color: '#475569', borderRadius: 1.5, width: 36, height: 36 }}>
                          <FileText size={18} />
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 600, color: '#1e293b' }}>
                            {inv.serie && inv.folio ? `${inv.serie}-${inv.folio}` : `#${inv.id?.slice(0, 8).toUpperCase()}`}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            CFDI 4.0
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: '#64748b' }}>
                        <Calendar size={18} color="#64748b" />
                        <Typography variant="body2">{formatDate(inv.createdAt || new Date())}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500, color: '#334155' }}>
                        {inv.customer?.name || "Cliente General"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                        {inv.customer?.rfc}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, color: '#1e293b' }}>
                        {formatCurrency(total)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        icon={status.icon} 
                        label={status.label} 
                        size="small"
                        sx={{ 
                          bgcolor: status.bgcolor, 
                          color: status.color, 
                          fontWeight: 600,
                          borderRadius: 1,
                          '& .MuiChip-icon': { color: 'inherit' }
                        }} 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                        <Tooltip title="Ver Detalle">
                          <IconButton size="small" component={Link} href={`/dashboard/invoices/${inv.id}`} sx={{ color: '#64748b', bgcolor: '#f1f5f9', borderRadius: 1.2 }}>
                            <Eye size={18} color="#64748b" />
                          </IconButton>
                        </Tooltip>
                        {inv.pdfUrl && (
                          <Tooltip title="Descargar PDF">
                            <IconButton 
                              size="small" 
                              onClick={() => window.open(inv.pdfUrl, "_blank")}
                              sx={{ color: '#64748b', bgcolor: '#f0fdf4', borderRadius: 1.2 }}
                            >
                              <Download size={18} color="#64748b" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <IconButton size="small" sx={{ borderRadius: 1.2 }}>
                          <MoreVertical size={18} color="#64748b" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Pagination 
            count={pagination.totalPages} 
            page={pagination.page} 
            onChange={handlePageChange} 
            shape="rounded"
            sx={{
              '& .MuiPaginationItem-root': { fontWeight: 600, color: '#475569' },
              '& .Mui-selected': { bgcolor: '#f1f5f9 !important', color: '#1e293b' }
            }}
          />
        </Box>
      )}

      {/* Action Links */}
      <Box sx={{ mt: 8 }}>
        <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 3, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <History size={18} color="#64748b" /> Acciones Rápidas
        </Typography>
        <Grid container spacing={2}>
          {[
            { label: 'Clientes', link: '/dashboard/customers', icon: <User size={18} /> },
            { label: 'Productos', link: '/dashboard/products', icon: <FileDigit size={18} /> },
            { label: 'Ventas', link: '/dashboard/sales', icon: <TrendingUp size={18} /> }
          ].map((item, i) => (
            <Grid key={i} size={{ xs: 12, sm: 4 }}>
              <Paper 
                component={Link} 
                href={item.link}
                variant="outlined" 
                sx={{ 
                  p: 2.5, borderRadius: 2, bgcolor: '#fff', display: 'flex', alignItems: 'center', gap: 2, 
                  textDecoration: 'none', transition: '0.2s', borderColor: '#e2e8f0',
                  '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1', transform: 'translateY(-2px)' } 
                }}
              >
                <Box sx={{ color: '#64748b', display: 'flex' }}>{item.icon}</Box>
                <Typography sx={{ fontWeight: 600, color: '#475569' }}>{item.label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
