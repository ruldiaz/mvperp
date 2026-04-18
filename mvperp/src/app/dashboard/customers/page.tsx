// src/app/dashboard/customers/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Customer } from "@/types/customer";
import { toast } from "react-hot-toast";
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Button, IconButton, OutlinedInput, InputAdornment, Stack, CircularProgress, Pagination, Grid, 
  Alert, Tooltip, TextField, Select, MenuItem, SelectChangeEvent
} from "@mui/material";
import { Search, Users, AlertTriangle, Eye, Trash2, UserPlus, Download } from "lucide-react";

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1, limit: 10, totalCount: 0, totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchCustomers = useCallback(async (page = 1, search = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
      });

      const res = await fetch(`/api/customers?${params}`, { credentials: "include" });

      if (!res.ok) throw new Error("Error al cargar los clientes");

      const data = await res.json();
      setCustomers(data.customers);
      setPagination(data.pagination);
      setError("");
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los clientes");
      toast.error("Error al cargar los clientes");
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCustomers(1, searchTerm);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchCustomers]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    fetchCustomers(value, searchTerm);
  };

  const handleLimitChange = (event: SelectChangeEvent) => {
    setPagination(prev => ({ ...prev, limit: Number(event.target.value) }));
    fetchCustomers(1, searchTerm);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer.")) return;

    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al eliminar");
      }

      setCustomers((prev) => prev.filter((customer) => customer.id !== id));
      toast.success("Cliente eliminado exitosamente");
    } catch (err) {
      console.error("Error deleting customer:", err);
      toast.error(err instanceof Error ? err.message : "Error al eliminar cliente");
    }
  };

  if (loading && customers.length === 0) {
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
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em', mb: 0.5 }}>
            Clientes
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.95rem' }}>
            Gestiona tu base de clientes de manera integral
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={() => router.push("/dashboard/customers/create")}
            startIcon={<UserPlus size={18} strokeWidth={1.5} />}
            sx={{ 
              height: 42,
              borderRadius: 1.5, 
              padding: '9px 24px', 
              bgcolor: '#334155', 
              '&:hover': { bgcolor: '#1e293b' }, 
              textTransform: 'none', 
              boxShadow: 'none', 
              fontWeight: 600,
              fontSize: '0.875rem'
            }}
          >
            Nuevo Cliente
          </Button>
          <Button
            variant="outlined"
            onClick={() => {/* Implement export */}}
            startIcon={<Download size={18} strokeWidth={1.5} />}
            sx={{ 
              height: 42,
              borderRadius: 1.5, 
              padding: '9px 24px', 
              borderColor: '#cbd5e1', 
              color: '#475569', 
              textTransform: 'none', 
              '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' }, 
              fontWeight: 600,
              fontSize: '0.875rem'
            }}
          >
            Exportar
          </Button>
        </Stack>
      </Box>

      {/* Stats Quick View */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, borderColor: '#e2e8f0', bgcolor: '#fff' }}>
            <Stack spacing={0.5}>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Clientes</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>{pagination.totalCount}</Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Bar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 4, borderRadius: 2, borderColor: '#e2e8f0', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'white' }}>
        <TextField
          size="small"
          placeholder="Buscar por nombre, RFC, email o razón social..."
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
          sx={{ width: { xs: '100%', md: 450 }, "& .MuiOutlinedInput-root": { borderRadius: 1.5, bgcolor: '#f8fafc' } }}
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

      {/* Clients Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, borderColor: '#e2e8f0', overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Cliente</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>RFC</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Razón Social</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Email</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Teléfono</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Registro</TableCell>
              <TableCell align="right" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((customer) => (
              <TableRow 
                key={customer.id} 
                hover 
                sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#fbfcfd' } }}
                onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
              >
                <TableCell>
                  <Typography sx={{ fontWeight: 700, color: '#334155', fontSize: '0.875rem' }}>{customer.name}</Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontFamily: 'monospace', color: '#64748b', fontSize: '0.85rem' }}>{customer.rfc || "—"}</Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ color: '#475569', fontSize: '0.85rem', maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={customer.razonSocial || ""}>
                    {customer.razonSocial || "—"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ color: '#475569', fontSize: '0.85rem', maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={customer.email || ""}>
                    {customer.email || "—"}
                  </Typography>
                </TableCell>
                <TableCell>
                   <Typography sx={{ color: '#475569', fontSize: '0.85rem' }}>{customer.phone || "—"}</Typography>
                </TableCell>
                <TableCell>
                   <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                    {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                  </Typography>
                </TableCell>
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  <Stack spacing={0.5} sx={{ flexDirection: "row", justifyContent: "flex-end" }}>
                    <Tooltip title="Ver detalles">
                      <IconButton size="small" component={Link} href={`/dashboard/customers/${customer.id}`} sx={{ color: '#94a3b8', '&:hover': { color: '#334155' } }}>
                        <Eye size={18} strokeWidth={1.5} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" onClick={() => handleDelete(customer.id!)} sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}>
                        <Trash2 size={18} strokeWidth={1.5} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            
            {!loading && customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Users size={40} color="#cbd5e1" style={{ marginBottom: 16 }} />
                    <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, mb: 1 }}>No se encontraron clientes</Typography>
                    <Typography sx={{ color: '#64748b', mb: 3 }}>{searchTerm ? "Intenta con otros términos de búsqueda." : "Aún no hay registros que mostrar."}</Typography>
                    {!searchTerm && (
                      <Button
                        variant="contained"
                        onClick={() => router.push("/dashboard/sales/create")}
                        sx={{ bgcolor: '#334155', textTransform: 'none', borderRadius: 1.5 }}
                      >
                        Agregar primer cliente
                      </Button>
                    )}
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
