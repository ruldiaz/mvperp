// src/app/dashboard/customers/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Customer } from "@/types/customer";
import { toast } from "react-hot-toast";
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Button, IconButton, OutlinedInput, InputAdornment, Stack, CircularProgress, Pagination, Grid, Alert
} from "@mui/material";
import { Search, Users, AlertTriangle, Eye, Trash2, UserPlus } from "lucide-react";

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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f8fafc' }}>
        <CircularProgress size={40} sx={{ color: '#0f172a' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', pb: 8 }}>
      {/* Hero Section */}
      <Box sx={{ pt: 6, pb: 6, px: 4, bgcolor: '#0f172a', color: 'white', borderRadius: '0 0 24px 24px', mb: 4, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Stack spacing={3} sx={{ flexDirection: { xs: 'column', md: 'row' }, justifyContent: "space-between", alignItems: { xs: 'flex-start', md: 'center' } }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.5px' }}>Clientes</Typography>
              <Typography variant="h6" sx={{ color: '#94a3b8', fontWeight: 400 }}>Gestiona tu base de clientes de manera integral</Typography>
            </Box>
            <Button
              component={Link}
              href="/dashboard/customers/create"
              variant="contained"
              startIcon={<UserPlus size={18} strokeWidth={1.5} />}
              sx={{ bgcolor: 'white', color: '#0f172a', fontWeight: 600, px: 3, py: 1.5, borderRadius: 2, '&:hover': { bgcolor: '#f1f5f9' }, textTransform: 'none', fontSize: '1rem' }}
            >
              Nuevo Cliente
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 4 }}>
        
        {/* Search & Stats */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: '#e2e8f0', height: '100%', display: 'flex', alignItems: 'center' }}>
              <OutlinedInput
                fullWidth
                placeholder="Buscar por nombre, RFC, email o razón social..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <Search size={18} color="#94a3b8" strokeWidth={1.5} />
                  </InputAdornment>
                }
                sx={{ borderRadius: 2, bgcolor: '#f8fafc', '& fieldset': { borderColor: '#e2e8f0' } }}
              />
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: '#e2e8f0', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f1f5f9' }}>
              <Box>
                <Typography sx={{ color: '#64748b', mb: 0.5, fontWeight: 500 }}>Total Clientes</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>{pagination.totalCount}</Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <Users size={18} color="#0f172a" strokeWidth={1.5} />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" icon={<AlertTriangle />} sx={{ mb: 4, borderRadius: 2 }}>{error}</Alert>
        )}

        {/* Clients Table */}
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, borderColor: '#e2e8f0', overflow: 'hidden', mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>RFC</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Razón Social</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Teléfono</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Registro</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#475569' }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, color: '#1e293b' }}>{customer.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontFamily: 'monospace', color: '#64748b' }}>{customer.rfc || "—"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ color: '#475569', maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={customer.razonSocial || ""}>
                      {customer.razonSocial || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ color: '#475569', maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={customer.email || ""}>
                      {customer.email || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                     <Typography sx={{ color: '#475569' }}>{customer.phone || "—"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                      {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack spacing={0.5} sx={{ flexDirection: "row", justifyContent: "flex-end" }}>
                      <IconButton size="small" component={Link} href={`/dashboard/customers/${customer.id}`} sx={{ color: '#94a3b8', '&:hover': { color: '#334155' } }}>
                        <Eye size={18} strokeWidth={1.5} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(customer.id!)} sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}>
                        <Trash2 size={18} strokeWidth={1.5} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              
              {!loading && customers.length === 0 && (
                 <TableRow>
                   <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                     <Users size={48} color="#cbd5e1" strokeWidth={1.5} style={{ marginBottom: 16 }} />
                     <Typography variant="h6" sx={{ color: '#0f172a', fontWeight: 600, mb: 1 }}>
                       {searchTerm ? "No se encontraron clientes" : "No hay clientes registrados"}
                     </Typography>
                     <Typography sx={{ color: '#64748b', mb: 3 }}>
                       {searchTerm ? "Intenta con otros términos de búsqueda" : "Comienza registrando tu primer cliente"}
                     </Typography>
                     {!searchTerm && (
                       <Button component={Link} href="/dashboard/customers/create" variant="outlined" startIcon={<UserPlus size={18} strokeWidth={1.5} />} sx={{ borderRadius: 2, textTransform: 'none', borderColor: '#cbd5e1', color: '#0f172a' }}>
                         Agregar Primer Cliente
                       </Button>
                     )}
                   </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination count={pagination.totalPages} page={pagination.page} onChange={handlePageChange} sx={{ '& .MuiPaginationItem-root': { borderRadius: 1.5 } }} />
          </Box>
        )}

      </Box>
    </Box>
  );
}
