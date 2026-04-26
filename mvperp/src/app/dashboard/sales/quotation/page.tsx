"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Quotation } from "@/types/sale";
import { toast } from "react-hot-toast";
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Pagination,
  InputAdornment,
  CircularProgress,
  Tooltip,
  Stack,
} from "@mui/material";
import {
  Search,
  Plus,
  Eye,
  FileEdit,
  Trash2,
  ArrowRightLeft,
  Filter,
  Download,
} from "lucide-react";
import { downloadQuotationPDF, CompanyInfo } from "./components/QuotationPDF";

const IVA_PERCENTAGE = 0.16;

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function Quotations() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const router = useRouter();

  const fetchQuotations = useCallback(
    async (page = 1, search = "") => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          ...(search && { search }),
        });

        const res = await fetch(`/api/quotations?${params}`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Error loading quotations");

        const data = await res.json();
        setQuotations(data.quotations);
        setPagination(data.pagination);
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar las cotizaciones");
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit]
  );

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await fetch("/api/company", { credentials: "include" });
        if (res.ok) setCompany((await res.json()).company);
      } catch (err) {
        console.error("Error fetching company", err);
      }
    };
    fetchCompany();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchQuotations(1, searchTerm);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchQuotations]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    fetchQuotations(value, searchTerm);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta cotización de forma permanente?")) return;
    try {
      const res = await fetch(`/api/quotations/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setQuotations((prev) => prev.filter((q) => q.id !== id));
        toast.success("Eliminado correctamente");
      }
    } catch (err) {
      toast.error("Error al eliminar");
    }
  };

  const handleDownload = async (q: Quotation) => {
    try {
      setDownloadingId(q.id!);
      await downloadQuotationPDF(q, company);
    } catch (err) {
      toast.error("Error al descargar PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);
  };

  const getStatusChip = (status: string) => {
    const config: Record<string, { label: string; color: string; bgColor: string }> = {
      pending: { label: "Pendiente", color: "#92400e", bgColor: "#fef3c7" },
      converted: { label: "Vendido", color: "#166534", bgColor: "#dcfce7" },
      expired: { label: "Expirada", color: "#374151", bgColor: "#f3f4f6" },
      rejected: { label: "Rechazada", color: "#991b1b", bgColor: "#fee2e2" },
    };
    const s = config[status] || config.pending;
    return (
      <Box sx={{ 
        px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 600,
        color: s.color, bgcolor: s.bgColor, display: 'inline-block' 
      }}>
        {s.label.toUpperCase()}
      </Box>
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", py: { xs: 4, md: 6 }, px: { xs: 1.5, sm: 3 } }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "flex-end" }, gap: { xs: 3, sm: 0 }, mb: { xs: 4, sm: 6 } }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em', mb: 1 }}>
            Cotizaciones
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.95rem' }}>
            Registro histórico de propuestas comerciales
          </Typography>
        </Box>
        <Button
          variant="contained"
          component={Link}
          href="/dashboard/sales/quotation/create"
          startIcon={<Plus size={18} strokeWidth={2} />}
          sx={{ borderRadius: 1.5, px: 3, py: 1.2, bgcolor: '#334155', '&:hover': { bgcolor: '#1e293b' }, textTransform: 'none', boxShadow: 'none', width: { xs: '100%', sm: 'auto' } }}
        >
          Crear Cotización
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 4, borderRadius: 2, borderColor: '#e2e8f0', display: 'flex', gap: { xs: 1, sm: 2 } }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por cliente o folio..."
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
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5, bgcolor: '#f8fafc' } }}
        />
        <Button variant="outlined" sx={{ borderRadius: 1.5, borderColor: '#e2e8f0', color: '#64748b', px: 2 }}>
          <Filter size={18} />
        </Button>
      </Paper>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, borderColor: '#e2e8f0', overflowX: 'auto' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Folio</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Fecha</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Cliente</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Total (IVA Inc.)</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Estado</TableCell>
              <TableCell align="right" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><CircularProgress size={24} sx={{ color: '#94a3b8' }} /></TableCell></TableRow>
            ) : quotations.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><Typography sx={{ color: '#94a3b8', fontSize: '0.9rem' }}>No se encontraron registros</Typography></TableCell></TableRow>
            ) : (
              quotations.map((q) => (
                <TableRow key={q.id} hover sx={{ '&:hover': { bgcolor: '#fbfcfd' } }}>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>#{q.id?.slice(0, 8).toUpperCase()}</TableCell>
                  <TableCell sx={{ color: '#64748b', fontSize: '0.85rem' }}>{new Date(q.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{q.customer?.name}</Typography>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>{q.customer?.rfc}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(q.totalAmount * 1.16)}</TableCell>
                  <TableCell>{getStatusChip(q.status)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                      <Tooltip title="Ver detalles">
                        <IconButton size="small" component={Link} href={`/dashboard/sales/quotation/${q.id}`} sx={{ color: '#94a3b8', '&:hover': { color: '#334155' } }}>
                          <Eye size={18} strokeWidth={1.5} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Descargar PDF">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDownload(q)} 
                          disabled={downloadingId === q.id}
                          sx={{ color: '#94a3b8', '&:hover': { color: '#3b82f6' } }}
                        >
                          {downloadingId === q.id ? <CircularProgress size={16} /> : <Download size={18} strokeWidth={1.5} />}
                        </IconButton>
                      </Tooltip>
                      {q.status === 'pending' && (
                        <Tooltip title="Editar">
                          <IconButton size="small" component={Link} href={`/dashboard/sales/quotation/${q.id}/edit`} sx={{ color: '#94a3b8', '&:hover': { color: '#334155' } }}>
                            <FileEdit size={18} strokeWidth={1.5} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Eliminar">
                        <IconButton size="small" onClick={() => handleDelete(q.id!)} sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}>
                          <Trash2 size={18} strokeWidth={1.5} />
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

      {pagination.totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <Pagination count={pagination.totalPages} page={pagination.page} onChange={handlePageChange} sx={{ '& .MuiPaginationItem-root': { borderRadius: 1.5 } }} />
        </Box>
      )}
    </Box>
  );
}
