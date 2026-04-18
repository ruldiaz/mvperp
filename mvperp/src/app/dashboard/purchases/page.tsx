// src/app/dashboard/purchases/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Purchase } from "@/types/purchase";
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
  InputAdornment,
  CircularProgress,
  Stack,
  Select,
  MenuItem,
  SelectChangeEvent
} from "@mui/material";
import { 
  Search, 
  Plus, 
  ShoppingBag, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  XCircle,
  FileText
} from "lucide-react";

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/purchases", { credentials: "include" });
        if (!res.ok) {
          console.error(`API Error: ${res.status} ${res.statusText}`);
          let errorMessage = "Error al cargar las compras";
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            const rawText = await res.text().catch(() => "");
            console.error("Raw error response:", rawText);
          }
          throw new Error(errorMessage);
        }
        const data = await res.json();
        setPurchases(data.purchases || []);
        setFilteredPurchases(data.purchases || []);
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar las compras");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPurchases();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredPurchases(purchases);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = purchases.filter((purchase) => {
        const supplierName = purchase.supplier?.name || "";
        const userName = purchase.user?.name || "";
        const status = purchase.status || "";
        return (
          supplierName.toLowerCase().includes(term) ||
          userName.toLowerCase().includes(term) ||
          status.toLowerCase().includes(term)
        );
      });
      setFilteredPurchases(filtered);
    }
  }, [searchTerm, purchases]);

  const goToDetail = (id: string) => {
    router.push(`/dashboard/purchases/${id}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const getStatusPill = (status: string) => {
    const config = {
      completed: {
        bg: "#dcfce7",
        color: "#166534",
        label: "Completada",
        icon: <CheckCircle2 size={12} strokeWidth={2.5} />
      },
      pending: {
        bg: "#fef3c7",
        color: "#92400e",
        label: "Pendiente",
        icon: <Clock size={12} strokeWidth={2.5} />
      },
      cancelled: {
        bg: "#fee2e2",
        color: "#991b1b",
        label: "Cancelada",
        icon: <XCircle size={12} strokeWidth={2.5} />
      }
    };
    const selected = config[status as keyof typeof config] || {
      bg: "#f1f5f9",
      color: "#475569",
      label: status?.toUpperCase() || "Desconocido",
      icon: <FileText size={12} strokeWidth={2.5} />
    };

    return (
      <Box sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.5,
        py: 0.5,
        borderRadius: 10,
        bgcolor: selected.bg,
        color: selected.color,
        fontSize: '0.7rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.02em'
      }}>
        {selected.icon}
        {selected.label}
      </Box>
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ color: '#334155', mb: 2 }} />
          <Typography sx={{ color: '#64748b', fontWeight: 500 }}>Cargando compras...</Typography>
        </Box>
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
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 6, flexWrap: "wrap", gap: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em', mb: 1 }}>
            Compras
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.95rem' }}>
            Gestiona el historial de órdenes y compras a proveedores
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => router.push("/dashboard/purchases/create")}
          startIcon={<Plus size={18} strokeWidth={2} />}
          sx={{ 
            borderRadius: 1.5, 
            px: 3, 
            py: 1.2, 
            bgcolor: '#334155', 
            '&:hover': { bgcolor: '#1e293b' }, 
            textTransform: 'none', 
            boxShadow: 'none',
            fontWeight: 600
          }}
        >
          Nueva Compra
        </Button>
      </Box>

      {/* Filter Bar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 4, borderRadius: 2, borderColor: '#e2e8f0', bgcolor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Buscar por proveedor, usuario o estado..."
          value={searchTerm}
          onChange={handleSearchChange}
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
        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>
          {filteredPurchases.length} compras encontradas
        </Typography>
      </Paper>

      {/* Table Container */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, borderColor: '#e2e8f0', overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Folio</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Fecha</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Proveedor</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Registrado por</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Estado</TableCell>
              <TableCell align="right" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Total</TableCell>
              <TableCell align="right" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Deuda</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPurchases.length > 0 ? (
              filteredPurchases.map((purchase) => (
                <TableRow 
                  key={purchase.id} 
                  hover 
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#fbfcfd' } }}
                  onClick={() => goToDetail(purchase.id)}
                >
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>
                    #{purchase.id.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell sx={{ color: '#64748b' }}>
                    {formatDate(purchase.date)}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>
                    {purchase.supplier?.name || "—"}
                  </TableCell>
                  <TableCell sx={{ color: '#64748b' }}>
                    {purchase.user?.name || "—"}
                  </TableCell>
                  <TableCell>
                    {getStatusPill(purchase.status)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    {formatCurrency(purchase.totalAmount)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500, color: (purchase.debt || 0) > 0 ? '#991b1b' : '#64748b' }}>
                    {formatCurrency(purchase.debt || 0)}
                  </TableCell>
                  <TableCell align="right">
                    <ChevronRight size={18} color="#cbd5e1" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                   <Box sx={{ color: '#cbd5e1', mb: 2 }}><ShoppingBag size={48} strokeWidth={1} /></Box>
                   <Typography sx={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                    {searchTerm ? `No se encontraron compras para "${searchTerm}"` : "Aún no hay compras registradas"}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
