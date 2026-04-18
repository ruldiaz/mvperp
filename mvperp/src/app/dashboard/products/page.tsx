"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Checkbox,
  Pagination,
  InputAdornment,
  CircularProgress,
  Stack,
  Select,
  MenuItem,
  SelectChangeEvent
} from "@mui/material";
import { Search, Plus, UploadCloud, Trash2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  stock?: number;
  category?: string;
  price?: number;
  sku?: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/products", { credentials: "include" });
        if (!res.ok) throw new Error("Error al cargar los productos");
        const data = await res.json();
        setProducts(data.products || []);
        setFilteredProducts(data.products || []);
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar los productos");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredProducts(products);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredProducts(
        products.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            (p.sku && p.sku.toLowerCase().includes(term)) ||
            (p.category && p.category.toLowerCase().includes(term))
        )
      );
    }
    setCurrentPage(1);
  }, [searchTerm, products]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleCheckbox = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const currentPageIds = currentItems.map((p) => p.id);
    if (currentPageIds.every((id) => selectedIds.includes(id))) {
      setSelectedIds((prev) =>
        prev.filter((id) => !currentPageIds.includes(id))
      );
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...currentPageIds])]);
    }
  };

  const handleDeleteSelected = async () => {
    if (
      !confirm(
        `¿Seguro que quieres borrar ${selectedIds.length} producto(s)? Esta acción no se puede deshacer.`
      )
    )
      return;
    try {
      const deletePromises = selectedIds.map((id) =>
        fetch(`/api/products/${id}`, {
          method: "DELETE",
          credentials: "include",
        })
      );
      const results = await Promise.allSettled(deletePromises);
      const failed = results.filter(
        (r) => r.status === "rejected" || !("value" in r && r.value.ok)
      );
      if (failed.length > 0) {
        toast.error(`${failed.length} productos no se pudieron borrar`);
        throw new Error(`${failed.length} productos fallaron`);
      }
      setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      toast.success("Productos eliminados exitosamente");
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar productos");
    }
  };

  const goToDetail = (id: string) => {
    router.push(`/dashboard/products/${id}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchTerm(e.target.value);

  const handleItemsPerPageChange = (e: SelectChangeEvent) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const formatCurrency = (amount?: number) => {
    if (amount == null) return "—";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 500 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ color: '#334155', mb: 2 }} />
          <Typography sx={{ color: '#64748b', fontWeight: 500 }}>Cargando productos...</Typography>
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
            Productos
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.95rem' }}>
            Gestiona tu catálogo de productos
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
          {selectedIds.length > 0 && (
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteSelected}
              startIcon={<Trash2 size={18} />}
              sx={{ borderRadius: 1.5, textTransform: 'none', px: 3, boxShadow: 'none' }}
            >
              Borrar ({selectedIds.length})
            </Button>
          )}
          <Button
            variant="contained"
            onClick={() => router.push("/dashboard/products/create")}
            startIcon={<Plus size={18} strokeWidth={2} />}
            sx={{ borderRadius: 1.5, px: 3, py: 1.2, bgcolor: '#334155', '&:hover': { bgcolor: '#1e293b' }, textTransform: 'none', boxShadow: 'none' }}
          >
            Crear producto
          </Button>
          <Button
            variant="outlined"
            onClick={() => router.push("/dashboard/products/import")}
            startIcon={<UploadCloud size={18} />}
            sx={{ borderRadius: 1.5, px: 3, py: 1.2, borderColor: '#cbd5e1', color: '#475569', textTransform: 'none', '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' } }}
          >
            Importar CSV
          </Button>
        </Stack>
      </Box>

      {/* Filter Bar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 4, borderRadius: 2, borderColor: '#e2e8f0', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <TextField
          size="small"
          placeholder="Buscar por nombre, SKU o categoría..."
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#64748b' }}>Mostrar</Typography>
          <Select
            size="small"
            value={itemsPerPage.toString()}
            onChange={handleItemsPerPageChange}
            sx={{ borderRadius: 1.5, bgcolor: '#f8fafc', "& .MuiOutlinedInput-notchedOutline": { borderColor: '#e2e8f0' } }}
          >
            <MenuItem value={10}>10 por página</MenuItem>
            <MenuItem value={20}>20 por página</MenuItem>
            <MenuItem value={50}>50 por página</MenuItem>
          </Select>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            {filteredProducts.length} resultados
          </Typography>
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, borderColor: '#e2e8f0', overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox 
                  size="small"
                  checked={currentItems.length > 0 && currentItems.every((p) => selectedIds.includes(p.id))}
                  onChange={handleSelectAll}
                  sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#334155' } }}
                />
              </TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Nombre</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>SKU</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Stock</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Categoría</TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Precio</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((p) => (
                <TableRow 
                  key={p.id} 
                  hover 
                  sx={{ 
                    cursor: 'pointer', 
                    '&:hover': { bgcolor: '#fbfcfd' },
                    ...(selectedIds.includes(p.id) && { bgcolor: 'rgba(51, 65, 85, 0.04)' })
                  }}
                  onClick={() => goToDetail(p.id)}
                >
                  <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      size="small"
                      checked={selectedIds.includes(p.id)}
                      onChange={(e) => handleCheckbox(p.id, e as any)}
                      sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#334155' } }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{p.name}</TableCell>
                  <TableCell sx={{ color: '#64748b' }}>{p.sku || "—"}</TableCell>
                  <TableCell>
                    <Box sx={{ 
                      display: 'inline-block',
                      px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 600,
                      color: (p.stock || 0) <= 5 ? '#991b1b' : '#166534',
                      bgcolor: (p.stock || 0) <= 5 ? '#fee2e2' : '#dcfce7'
                    }}>
                      {p.stock ?? 0}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#64748b' }}>{p.category || "—"}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(p.price)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                    {searchTerm ? `No se encontraron productos para "${searchTerm}"` : "No hay productos registrados"}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {filteredProducts.length > 0 && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <Pagination 
            count={totalPages} 
            page={currentPage} 
            onChange={(e, val) => goToPage(val)} 
            sx={{ '& .MuiPaginationItem-root': { borderRadius: 1.5 } }} 
          />
        </Box>
      )}
    </Box>
  );
}
