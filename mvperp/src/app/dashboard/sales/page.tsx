// src/app/dashboard/sales/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sale } from "@/types/sale";
import { toast } from "react-hot-toast";
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Button, IconButton, OutlinedInput, InputAdornment, Stack, CircularProgress, Pagination, Grid, 
  Alert, Chip, Tooltip, Avatar, AvatarGroup, Select, MenuItem, SelectChangeEvent, TextField
} from "@mui/material";
import { 
  Search, Plus, Eye, Trash2, FileText, BarChart2, DollarSign, Package, 
  Calendar, Clock, AlertTriangle, FileCheck, Filter, Download
} from "lucide-react";

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

const IVA_PERCENTAGE = 0.16;
const calculateTotalWithIVA = (amount: number): number => amount * (1 + IVA_PERCENTAGE);
const calculateIVA = (amount: number): number => amount * IVA_PERCENTAGE;

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1, limit: 10, totalCount: 0, totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todas");
  const router = useRouter();

  const fetchSales = useCallback(async (page = 1, search = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
      });
      const res = await fetch(`/api/sales?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar las ventas");
      const data = await res.json();
      setSales(data.sales);
      setPagination(data.pagination);
      setError("");
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las ventas");
      toast.error("Error al cargar las ventas");
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSales(1, searchTerm);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchSales]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    fetchSales(value, searchTerm);
  };

  const handleLimitChange = (event: SelectChangeEvent) => {
    setPagination(prev => ({ ...prev, limit: Number(event.target.value) }));
    fetchSales(1, searchTerm);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta venta? Esta acción no se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/sales/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al eliminar");
      }
      setSales((prev) => prev.filter((sale) => sale.id !== id));
      toast.success("Venta eliminada exitosamente");
    } catch (err) {
      console.error("Error deleting sale:", err);
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);
  const formatDate = (dateString: string | Date) => new Date(dateString).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
  const formatTime = (dateString: string | Date) => new Date(dateString).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  const getStatusBadge = (status: string) => {
    type StatusKey = "completed" | "cancelled" | "refunded" | "pending";
    const statusConfig: Record<StatusKey, { color: "success" | "error" | "warning" | "info" | "default", label: string }> = {
      completed: { color: "success", label: "Completada" },
      cancelled: { color: "error", label: "Cancelada" },
      refunded: { color: "warning", label: "Reembolsada" },
      pending: { color: "info", label: "Pendiente" },
    };
    const config = statusConfig[status as StatusKey] || { color: "default", label: status };
    return (
      <Chip 
        label={config.label} 
        size="small" 
        sx={{ 
          fontWeight: 700, 
          borderRadius: '6px',
          bgcolor: (theme) => {
            const colors = { success: '#ecfdf5', error: '#fef2f2', warning: '#fffbeb', info: '#eff6ff', default: '#f8fafc' };
            return colors[config.color] || colors.default;
          },
          color: (theme) => {
            const colors = { success: '#065f46', error: '#991b1b', warning: '#92400e', info: '#1e40af', default: '#475569' };
            return colors[config.color] || colors.default;
          }
        }} 
      />
    );
  };

  const calculateTotalAmountWithIVA = () => sales.reduce((sum, sale) => sum + calculateTotalWithIVA(sale.totalAmount || 0), 0);
  const calculateAverageWithIVA = () => sales.length > 0 ? calculateTotalAmountWithIVA() / sales.length : 0;

  if (loading && sales.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={40} sx={{ color: '#334155' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", py: 6, px: 3, animation: 'fadeIn 0.3s ease' }}>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 6, flexWrap: "wrap", gap: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em' }}>
            Histórico de Ventas
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.95rem' }}>
            Administra y revisa todas las ventas de tu negocio (IVA 16% incluido)
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={() => router.push("/dashboard/sales/create")}
            startIcon={<Plus size={18} strokeWidth={1.5} />}
            sx={{ 
              borderRadius: 1.5, 
              padding: '9px 24px', 
              bgcolor: '#334155', 
              '&:hover': { bgcolor: '#1e293b' }, 
              textTransform: 'none', 
              boxShadow: 'none', 
              fontWeight: 600,
              fontSize: '0.875rem',
              minHeight: '42px',
              height: '42px'
            }}
          >
            Nueva Venta
          </Button>
          <Button
            variant="outlined"
            onClick={() => {/* Implement export if needed */}}
            startIcon={<Download size={18} strokeWidth={1.5} />}
            sx={{ 
              borderRadius: 1.5, 
              padding: '9px 24px', 
              borderColor: '#cbd5e1', 
              color: '#475569', 
              textTransform: 'none', 
              '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' }, 
              fontWeight: 600,
              fontSize: '0.875rem',
              minHeight: '42px',
              height: '42px'
            }}
          >
            Exportar
          </Button>
        </Stack>
      </Box>

      {/* Stats Quick View (Integrated Style) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, borderColor: '#e2e8f0', bgcolor: '#fff' }}>
            <Stack spacing={0.5}>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ventas Totales</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>{pagination.totalCount}</Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, borderColor: '#e2e8f0', bgcolor: '#fff' }}>
            <Stack spacing={0.5}>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue Total</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#059669' }}>{formatCurrency(calculateTotalAmountWithIVA())}</Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, borderColor: '#e2e8f0', bgcolor: '#fff' }}>
            <Stack spacing={0.5}>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ticket Promedio</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>{formatCurrency(calculateAverageWithIVA())}</Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, borderColor: '#e2e8f0', bgcolor: '#fff' }}>
            <Stack spacing={0.5}>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Última Actividad</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#6366f1' }}>{sales.length > 0 ? formatDate(sales[0].date) : "—"}</Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Bar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 4, borderRadius: 2, borderColor: '#e2e8f0', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'white' }}>
        <TextField
          size="small"
          placeholder="Buscar por ID, cliente, productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="#94a3b8" />
                </InputAdornment>
              ),
            }
          }}
          sx={{ width: { xs: '100%', md: 400 }, "& .MuiOutlinedInput-root": { borderRadius: 1.5, bgcolor: '#f8fafc' } }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#64748b' }}>Mostrar</Typography>
          <Select
            size="small"
            value={pagination.limit.toString()}
            onChange={handleLimitChange}
            sx={{ borderRadius: 1.5, bgcolor: '#f8fafc', "& .MuiOutlinedInput-notchedOutline": { borderColor: '#e2e8f0' } }}
          >
            <MenuItem value={10}>10 por página</MenuItem>
            <MenuItem value={25}>25 por página</MenuItem>
            <MenuItem value={50}>50 por página</MenuItem>
          </Select>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
            {pagination.totalCount} resultados
          </Typography>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" icon={<AlertTriangle size={18} />} sx={{ mb: 4, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, borderColor: '#e2e8f0', overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Venta</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Fecha</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Cliente</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Productos</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Total con IVA</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Estado</TableCell>
              <TableCell align="right" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sales.map((sale) => {
              const totalWithIVA = calculateTotalWithIVA(sale.totalAmount || 0);
              const ivaAmount = calculateIVA(sale.totalAmount || 0);

              return (
                <TableRow 
                  key={sale.id} 
                  hover 
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#fbfcfd' } }}
                  onClick={() => router.push(`/dashboard/sales/${sale.id}`)}
                >
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, color: '#334155', fontSize: '0.875rem' }}>
                      #{sale.id?.slice(0, 8).toUpperCase()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>{formatDate(sale.date)}</Typography>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>{formatTime(sale.date)}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>{sale.customer?.name || "N/A"}</Typography>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>{sale.customer?.email || "Sin correo"}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={1} sx={{ flexDirection: "row", alignItems: "center" }}>
                      <Typography sx={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>
                        {sale.saleItems?.length || 0}
                      </Typography>
                      <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 22, height: 22, fontSize: '0.6rem', border: '1px solid #fff' } }}>
                        {(sale.saleItems || []).map((item, idx) => (
                          <Tooltip key={idx} title={item.product?.name || "Producto"}>
                            <Avatar sx={{ bgcolor: '#475569' }}>{idx + 1}</Avatar>
                          </Tooltip>
                        ))}
                      </AvatarGroup>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography sx={{ fontWeight: 700, color: '#059669', fontSize: '0.95rem' }}>{formatCurrency(totalWithIVA)}</Typography>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>IVA: {formatCurrency(ivaAmount)}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(sale.status || "pending")}
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Stack spacing={0.5} sx={{ flexDirection: "row", justifyContent: "flex-end" }}>
                      <Tooltip title="Ver detalles">
                        <IconButton size="small" component={Link} href={`/dashboard/sales/${sale.id}`} sx={{ color: '#94a3b8', '&:hover': { color: '#334155' } }}>
                          <Eye size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Facturar">
                        <IconButton size="small" component={Link} href={`/dashboard/invoices/create?saleId=${sale.id}`} sx={{ color: '#059669', '&:hover': { color: '#047857' } }}>
                          <FileCheck size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Borrar">
                        <IconButton size="small" onClick={() => handleDelete(sale.id!)} sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}>
                          <Trash2 size={18} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
            
            {sales.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Package size={40} color="#cbd5e1" style={{ marginBottom: 16 }} />
                    <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, mb: 1 }}>No se encontraron ventas</Typography>
                    <Typography sx={{ color: '#64748b', mb: 3 }}>Aún no hay registros que mostrar.</Typography>
                    <Button
                      variant="contained"
                      onClick={() => router.push("/dashboard/sales/create")}
                      sx={{ bgcolor: '#334155', textTransform: 'none', borderRadius: 1.5 }}
                    >
                      Crear primera venta
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination 
            count={pagination.totalPages} 
            page={pagination.page} 
            onChange={handlePageChange}
            sx={{ 
                '& .MuiPaginationItem-root': { borderRadius: 1.5, fontWeight: 600 },
                '& .Mui-selected': { bgcolor: '#334155 !important', color: 'white' }
            }} 
          />
        </Box>
      )}
    </Box>
  );
}
