// src/app/dashboard/suppliers/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Supplier } from "@/types/supplier";
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
  OutlinedInput,
  InputAdornment,
  Stack,
  CircularProgress,
  Pagination,
  Grid,
  Tooltip,
  Avatar,
  Chip
} from "@mui/material";
import {
  Search,
  Plus,
  Eye,
  Trash2,
  Building2,
  Phone,
  Mail,
  MoreHorizontal,
  ShoppingBag,
  ExternalLink,
  Calendar,
  Filter,
  Users
} from "lucide-react";

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1, limit: 10, totalCount: 0, totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchSuppliers = useCallback(async (page = 1, search = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
      });

      const res = await fetch(`/api/suppliers?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar los proveedores");

      const data = await res.json();
      setSuppliers(data.suppliers);
      setPagination(data.pagination);
      setError("");
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los proveedores");
      toast.error("Error al cargar proveedores");
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuppliers(1, searchTerm);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchSuppliers]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    fetchSuppliers(value, searchTerm);
  };

  const handleCreatePurchase = (supplierId: string) => {
    router.push(`/dashboard/purchases/create?supplierId=${supplierId}`);
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
      month: "2-digit",
      year: "numeric"
    });
  };

  if (loading && suppliers.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Stack sx={{ alignItems: 'center' }} spacing={2}>
          <CircularProgress size={32} sx={{ color: '#334155' }} />
          <Typography sx={{ color: '#64748b' }}>Cargando proveedores...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, px: { xs: 2, md: 4 }, animation: 'fadeIn 0.5s ease' }}>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em' }}>
            Proveedores
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Gestión centralizada de suministros y abastecimiento
          </Typography>
        </Box>
        <Button
          variant="contained"
          component={Link}
          href="/dashboard/suppliers/create"
          startIcon={<Plus size={18} />}
          sx={{
            bgcolor: '#334155',
            '&:hover': { bgcolor: '#1e293b' },
            textTransform: 'none',
            borderRadius: 2,
            px: 3,
            py: 1,
            boxShadow: 'none',
            fontWeight: 600
          }}
        >
          Nuevo Proveedor
        </Button>
      </Box>

      {/* Filters Bar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 4, borderRadius: 3, borderColor: '#e2e8f0', bgcolor: '#f8fafc' }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <OutlinedInput
              fullWidth
              size="small"
              placeholder="Buscar por nombre, RFC o contacto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 2 }}
              startAdornment={
                <InputAdornment position="start">
                  <Search size={16} color="#94a3b8" />
                </InputAdornment>
              }
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Tooltip title="Filtrar">
                <IconButton sx={{ border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: 'white' }}>
                  <Filter size={18} color="#64748b" />
                </IconButton>
              </Tooltip>
              <Chip 
                label={`${pagination.totalCount} Proveedores`} 
                variant="outlined" 
                sx={{ borderRadius: 2, fontWeight: 600, color: '#475569', bgcolor: 'white' }} 
              />
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* List / Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, borderColor: '#e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2 }}>PROVEEDOR</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2 }}>CONTACTO</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2 }}>TELÉFONO</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2 }}>TOTAL COMPRADO</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2 }}>ÚLTIMA COMPRA</TableCell>
              <TableCell align="right" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2 }}>ACCIONES</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                  <Stack sx={{ alignItems: 'center', opacity: 0.5 }} spacing={2}>
                    <Building2 size={48} strokeWidth={1} />
                    <Typography variant="body1">No se encontraron proveedores</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((supplier) => (
                <TableRow 
                  key={supplier.id} 
                  hover 
                  sx={{ '&:hover': { bgcolor: '#fbfcfd' }, cursor: 'pointer' }}
                  onClick={() => router.push(`/dashboard/suppliers/${supplier.id}`)}
                >
                  <TableCell>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                      <Avatar sx={{ bgcolor: '#f1f5f9', color: '#475569', borderRadius: 2, width: 40, height: 40 }}>
                        <Building2 size={20} />
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 600, color: '#1e293b', lineHeight: 1.2 }}>
                          {supplier.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          {supplier.rfc || 'Sin RFC'}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={1}>
                      <Typography variant="body2" sx={{ color: '#445569' }}>
                        {supplier.contactName || '-'}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {supplier.phone ? (
                       <Stack sx={{ alignItems: 'center', color: '#64748b' }} direction="row" spacing={1}>
                        <Phone size={14} />
                        <Typography variant="body2">{supplier.phone}</Typography>
                      </Stack>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, color: '#334155' }}>
                      {formatCurrency(supplier.totalPurchases)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {supplier.lastPurchase ? (
                      <Stack sx={{ alignItems: 'center', color: '#64748b' }} direction="row" spacing={1}>
                        <Calendar size={14} />
                        <Typography variant="body2">{formatDate(supplier.lastPurchase)}</Typography>
                      </Stack>
                    ) : '-'}
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Stack sx={{ justifyContent: 'flex-end' }} direction="row" spacing={1}>
                      <Tooltip title="Realizar Compra">
                        <IconButton 
                          size="small" 
                          onClick={() => handleCreatePurchase(supplier.id)}
                          sx={{ color: '#10b981', bgcolor: '#f0fdf4', '&:hover': { bgcolor: '#dcfce7' } }}
                        >
                          <ShoppingBag size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Ver Detalles">
                        <IconButton 
                          size="small" 
                          component={Link} 
                          href={`/dashboard/suppliers/${supplier.id}`}
                          sx={{ color: '#6366f1', bgcolor: '#eef2ff', '&:hover': { bgcolor: '#e0e7ff' } }}
                        >
                          <Eye size={18} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
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
    </Box>
  );
}
