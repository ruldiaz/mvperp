// src/app/dashboard/customers/[id]/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Customer } from "@/types/customer";
import { Sale } from "@/types/sale";
import { toast } from "react-hot-toast";
import {
  Box, Typography, Paper, Grid, Stack, Button, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel, FormControl, CircularProgress, Alert, Tooltip
} from "@mui/material";
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Building, Briefcase, FileText, BarChart2, Package, ShoppingBag, CheckCircle, XCircle, RefreshCw, AlertTriangle, DollarSign, Eye } from "lucide-react";

interface CustomerDetails extends Customer {
  sales: Sale[];
}

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  const customerId = params.id as string;

  const fetchCustomer = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/customers/${customerId}`, { credentials: "include" });

      if (!res.ok) {
        if (res.status === 404) throw new Error("Cliente no encontrado");
        throw new Error("Error al cargar el cliente");
      }

      const data = await res.json();
      setCustomer(data.customer);
    } catch (err) {
      console.error("Error fetching customer:", err);
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      fetchCustomer();
    }
  }, [customerId, fetchCustomer]);

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer.")) return;

    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al eliminar");
      }

      toast.success("Cliente eliminado exitosamente");
      setTimeout(() => { router.push("/dashboard/customers"); }, 1500);
    } catch (err) {
      console.error("Error deleting customer:", err);
      toast.error(err instanceof Error ? err.message : "Error al eliminar cliente");
    }
  };

  const handleEdit = (updatedCustomer: CustomerDetails) => {
    setCustomer(updatedCustomer);
    setShowEditModal(false);
    toast.success("Cliente actualizado exitosamente");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getStatusBadge = (status: string) => {
    const config: any = {
      completed: { bgcolor: "#ecfdf5", color: "#065f46", label: "COMPLETADA", icon: <CheckCircle size={14} /> },
      cancelled: { bgcolor: "#fef2f2", color: "#991b1b", label: "CANCELADA", icon: <XCircle size={14} /> },
      refunded: { bgcolor: "#fffbeb", color: "#92400e", label: "REEMBOLSADA", icon: <RefreshCw size={14} /> },
    };
    const selected = config[status] || { bgcolor: "#f8fafc", color: "#475569", label: status.toUpperCase(), icon: <FileText size={14} /> };
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.2, py: 0.4, borderRadius: 1.5, bgcolor: selected.bgcolor, color: selected.color, fontWeight: 700, fontSize: '0.65rem', border: '1px solid rgba(0,0,0,0.05)' }}>
        {selected.icon} {selected.label}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={40} sx={{ color: '#334155' }} />
      </Box>
    );
  }

  if (error || !customer) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', py: 8, px: 3 }}>
        <Alert severity="error" icon={<AlertTriangle size={18} />} sx={{ mb: 4, borderRadius: 2 }}>
          {error || "No se pudo cargar la información del cliente"}
        </Alert>
        <Button 
          component={Link} 
          href="/dashboard/customers" 
          variant="contained" 
          startIcon={<ArrowLeft size={18} />} 
          sx={{ textTransform: 'none', borderRadius: 1.5, bgcolor: '#334155', boxShadow: 'none' }}
        >
          Volver a clientes
        </Button>
      </Box>
    );
  }

  const totalSales = customer.sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalProducts = customer.sales.reduce((sum, sale) => sum + sale.saleItems.length, 0);

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
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
            <IconButton 
              component={Link} 
              href="/dashboard/customers" 
              size="small" 
              sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}
            >
              <ArrowLeft size={20} />
            </IconButton>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em' }}>
              {customer.name}
            </Typography>
          </Stack>
          <Typography sx={{ color: '#64748b', fontSize: '0.95rem', ml: 4.5 }}>
            {customer.email || "Sin correo"} • Registrado el {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : "—"}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={() => setShowEditModal(true)}
            startIcon={<Edit size={18} strokeWidth={1.5} />}
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
            Editar Cliente
          </Button>
          <Button
            variant="outlined"
            onClick={handleDelete}
            startIcon={<Trash2 size={18} strokeWidth={1.5} />}
            sx={{ 
              height: 42,
              borderRadius: 1.5, 
              padding: '9px 24px', 
              borderColor: '#fee2e2', 
              color: '#ef4444', 
              textTransform: 'none', 
              '&:hover': { bgcolor: '#fef2f2', borderColor: '#fca5a5' }, 
              fontWeight: 600,
              fontSize: '0.875rem'
            }}
          >
            Eliminar
          </Button>
        </Stack>
      </Box>

      {/* Stats Quick View */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, borderColor: '#e2e8f0', bgcolor: '#fff' }}>
            <Stack spacing={0.5}>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ventas Totales</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>{customer.sales.length}</Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, borderColor: '#e2e8f0', bgcolor: '#fff' }}>
            <Stack spacing={0.5}>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor Total</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#059669' }}>{formatCurrency(totalSales)}</Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, borderColor: '#e2e8f0', bgcolor: '#fff' }}>
            <Stack spacing={0.5}>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Artículos</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>{totalProducts}</Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Contact Info */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: '#e2e8f0', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 1.5, color: '#64748b' }}>
                <MapPin size={18} strokeWidth={1.5} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.1rem' }}>Contacto y Ubicación</Typography>
            </Box>

            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>Email:</Typography>
                <Typography sx={{ color: '#1e293b', fontWeight: 600, fontSize: '0.9rem' }}>{customer.email || "—"}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>Teléfono:</Typography>
                <Typography sx={{ color: '#1e293b', fontWeight: 600, fontSize: '0.9rem' }}>{customer.phone || "—"}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>Dirección:</Typography>
                <Typography sx={{ color: '#1e293b', fontWeight: 600, fontSize: '0.9rem', textAlign: 'right', maxWidth: '60%' }}>{customer.address || "—"}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.5 }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>Domicilio Fiscal:</Typography>
                <Typography sx={{ color: '#1e293b', fontWeight: 600, fontSize: '0.9rem', textAlign: 'right', maxWidth: '60%' }}>{customer.fiscalAddress || "—"}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Tax Info */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: '#e2e8f0', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 1.5, color: '#64748b' }}>
                <Building size={18} strokeWidth={1.5} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.1rem' }}>Información Fiscal</Typography>
            </Box>

            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>RFC:</Typography>
                <Typography sx={{ color: '#1e293b', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'monospace' }}>{customer.rfc || "—"}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>Razón Social:</Typography>
                <Typography sx={{ color: '#1e293b', fontWeight: 600, fontSize: '0.9rem', textAlign: 'right', maxWidth: '60%' }}>{customer.razonSocial || "—"}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>Régimen Fiscal:</Typography>
                <Typography sx={{ color: '#1e293b', fontWeight: 600, fontSize: '0.9rem', textAlign: 'right', maxWidth: '60%' }}>{customer.taxRegime || "—"}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.5 }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>Uso CFDI:</Typography>
                <Typography sx={{ color: '#1e293b', fontWeight: 600, fontSize: '0.9rem' }}>{customer.usoCFDI || "—"}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Purchase History */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 1.5, color: '#64748b' }}>
            <ShoppingBag size={18} strokeWidth={1.5} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.1rem' }}>Histórico de Compras</Typography>
        </Box>

        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, borderColor: '#e2e8f0', overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Venta</TableCell>
                <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Fecha</TableCell>
                <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Productos</TableCell>
                <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Total</TableCell>
                <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Estado</TableCell>
                <TableCell align="right" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customer.sales.length > 0 ? (
                customer.sales.map((sale) => (
                  <TableRow key={sale.id} hover sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#fbfcfd' } }} onClick={() => router.push(`/dashboard/sales/${sale.id}`)}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, color: '#334155', fontSize: '0.875rem' }}>
                        #{sale.id?.slice(0, 8).toUpperCase()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>{formatDate(sale.date)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: '#475569', fontSize: '0.85rem' }}>{sale.saleItems.length} artículos</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, color: '#059669', fontSize: '0.9rem' }}>{formatCurrency(sale.totalAmount)}</Typography>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(sale.status || "completed")}
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Ver venta">
                        <IconButton size="small" component={Link} href={`/dashboard/sales/${sale.id}`} sx={{ color: '#94a3b8', '&:hover': { color: '#334155' } }}>
                          <Eye size={18} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.9rem' }}>No hay compras registradas para este cliente</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Edit Modal */}
      {showEditModal && (
        <EditCustomerModal 
          customer={customer} 
          onClose={() => setShowEditModal(false)} 
          onCustomerUpdated={handleEdit} 
        />
      )}
    </Box>
  );
}

function EditCustomerModal({ customer, onClose, onCustomerUpdated }: { customer: CustomerDetails; onClose: () => void; onCustomerUpdated: (customer: CustomerDetails) => void; }) {
  const [formData, setFormData] = useState({ ...customer });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error al actualizar");

      const data = await res.json();
      onCustomerUpdated(data.customer);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo actualizar el cliente");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog 
      open={true} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
    >
      <DialogTitle sx={{ fontWeight: 700, px: 3, pt: 3 }}>Editar Información del Cliente</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ px: 3, pb: 3 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Nombre Completo"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="RFC"
                  value={formData.rfc || ""}
                  onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Razón Social"
                  value={formData.razonSocial || ""}
                  onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Dirección"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  multiline
                  rows={2}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Domicilio Fiscal"
                  value={formData.fiscalAddress || ""}
                  onChange={(e) => setFormData({ ...formData, fiscalAddress: e.target.value })}
                  multiline
                  rows={2}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Uso CFDI</InputLabel>
                  <Select
                    value={formData.usoCFDI || "G03"}
                    label="Uso CFDI"
                    onChange={(e) => setFormData({ ...formData, usoCFDI: e.target.value })}
                  >
                    <MenuItem value="G01">G01 - Adquisición de mercancías</MenuItem>
                    <MenuItem value="G03">G03 - Gastos en general</MenuItem>
                    <MenuItem value="P01">P01 - Por definir</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Régimen Fiscal</InputLabel>
                  <Select
                    value={formData.taxRegime || "601"}
                    label="Régimen Fiscal"
                    onChange={(e) => setFormData({ ...formData, taxRegime: e.target.value })}
                  >
                    <MenuItem value="601">601 - General de Ley Personas Morales</MenuItem>
                    <MenuItem value="603">603 - Personas Morales con Fines no Lucrativos</MenuItem>
                    <MenuItem value="605">605 - Sueldos y Salarios e Ingresos Asimilados a Salarios</MenuItem>
                    <MenuItem value="612">612 - Personas Físicas con Actividades Empresariales y Profesionales</MenuItem>
                    <MenuItem value="626">626 - Régimen Simplificado de Confianza</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 1.5, textTransform: 'none', px: 3, color: '#64748b', borderColor: '#cbd5e1' }}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={saving} sx={{ borderRadius: 1.5, textTransform: 'none', px: 4, bgcolor: '#334155', '&:hover': { bgcolor: '#1e293b' }, boxShadow: 'none' }}>
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
