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
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel, FormControl, CircularProgress, Alert
} from "@mui/material";
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Building, Briefcase, FileText, BarChart2, Package, ShoppingBag, CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp, AlertTriangle, DollarSign } from "lucide-react";

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
      completed: { bgcolor: "#dcfce7", color: "#166534", label: "COMPLETADA", icon: <CheckCircle size={18} /> },
      cancelled: { bgcolor: "#fee2e2", color: "#991b1b", label: "CANCELADA", icon: <XCircle size={18} /> },
      refunded: { bgcolor: "#ffedd5", color: "#9a3412", label: "REEMBOLSADA", icon: <RefreshCw size={18} /> },
    };
    const selected = config[status] || { bgcolor: "#f1f5f9", color: "#334155", label: status.toUpperCase(), icon: <FileText size={18} /> };
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0.5, borderRadius: 8, bgcolor: selected.bgcolor, color: selected.color, fontWeight: 600, fontSize: '0.75rem' }}>
        {selected.icon} {selected.label}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f8fafc' }}>
        <CircularProgress size={40} sx={{ color: '#0f172a' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 8, px: 4 }}>
        <Alert severity="error" icon={<AlertTriangle />} sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
        <Button component={Link} href="/dashboard/customers" variant="contained" startIcon={<ArrowLeft size={18} />} sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}>
          Volver a clientes
        </Button>
      </Box>
    );
  }

  if (!customer) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 8, px: 4 }}>
        <Alert severity="warning" icon={<AlertTriangle />} sx={{ mb: 3, borderRadius: 2 }}>No se pudo cargar la información del cliente</Alert>
        <Button component={Link} href="/dashboard/customers" variant="contained" startIcon={<ArrowLeft size={18} />} sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}>
          Volver a clientes
        </Button>
      </Box>
    );
  }

  const totalSales = customer.sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalProducts = customer.sales.reduce((sum, sale) => sum + sale.saleItems.length, 0);
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', pb: 8 }}>
      {/* Hero Section */}
      <Box sx={{ pt: 6, pb: 6, px: 4, bgcolor: '#0f172a', color: 'white', borderRadius: '0 0 24px 24px', mb: 4, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Button 
            component={Link} 
            href="/dashboard/customers" 
            startIcon={<ArrowLeft size={18} strokeWidth={1.5} />} 
            sx={{ color: '#94a3b8', textTransform: 'none', mb: 3, '&:hover': { bgcolor: 'transparent', color: 'white' } }}
          >
            Volver a clientes
          </Button>

          <Stack spacing={3} sx={{ flexDirection: { xs: 'column', md: 'row' }, justifyContent: "space-between", alignItems: { xs: 'flex-start', md: 'center' } }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.5px' }}>{customer.name}</Typography>
              <Typography variant="h6" sx={{ color: '#94a3b8', fontWeight: 400 }}>
                 {customer.email || "Sin correo registrado"} • Registrado el {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : "—"}
              </Typography>
            </Box>
            <Stack spacing={2} sx={{ flexDirection: "row" }}>
              <Button 
                onClick={() => setShowEditModal(true)} 
                variant="contained" 
                startIcon={<Edit size={18} strokeWidth={1.5} />} 
                sx={{ bgcolor: 'white', color: '#0f172a', fontWeight: 600, px: 3, py: 1.5, borderRadius: 2, '&:hover': { bgcolor: '#f1f5f9' }, textTransform: 'none', fontSize: '1rem' }}
              >
                 Editar Cliente
              </Button>
              <Button 
                onClick={handleDelete} 
                variant="outlined" 
                color="error" 
                startIcon={<Trash2 size={18} strokeWidth={1.5} />} 
                sx={{ borderColor: 'rgba(239, 68, 68, 0.5)', color: '#fee2e2', fontWeight: 600, px: 3, py: 1.5, borderRadius: 2, '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }, textTransform: 'none', fontSize: '1rem' }}
              >
                 Eliminar
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 4 }}>

        {/* Highlight Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
           <Grid size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0', bgcolor: '#eff6ff' }}>
                 <Stack sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                       <Typography sx={{ color: '#475569', fontWeight: 500, mb: 1 }}>Total de Ventas</Typography>
                       <Typography variant="h3" sx={{ fontWeight: 800, color: '#1e3a8a' }}>{customer.sales.length}</Typography>
                    </Box>
                    <Box sx={{ p: 2, bgcolor: '#3b82f6', borderRadius: 3, color: 'white' }}><BarChart2 size={18} strokeWidth={1.5} /></Box>
                 </Stack>
              </Paper>
           </Grid>
           <Grid size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0', bgcolor: '#ecfdf5' }}>
                 <Stack sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                       <Typography sx={{ color: '#475569', fontWeight: 500, mb: 1 }}>Valor Total</Typography>
                       <Typography variant="h3" sx={{ fontWeight: 800, color: '#065f46' }}>{formatCurrency(totalSales)}</Typography>
                    </Box>
                    <Box sx={{ p: 2, bgcolor: '#10b981', borderRadius: 3, color: 'white' }}><DollarSign size={18} strokeWidth={1.5} /></Box>
                 </Stack>
              </Paper>
           </Grid>
           <Grid size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0', bgcolor: '#fdf4ff' }}>
                 <Stack sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                       <Typography sx={{ color: '#475569', fontWeight: 500, mb: 1 }}>Productos Comprados</Typography>
                       <Typography variant="h3" sx={{ fontWeight: 800, color: '#86198f' }}>{totalProducts}</Typography>
                    </Box>
                    <Box sx={{ p: 2, bgcolor: '#d946ef', borderRadius: 3, color: 'white' }}><Package size={18} strokeWidth={1.5} /></Box>
                 </Stack>
              </Paper>
           </Grid>
        </Grid>

        <Grid container spacing={4} sx={{ mb: 4 }}>
           {/* Información de Contacto */}
           <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0', height: '100%' }}>
                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <MapPin size={18} color="#64748b" strokeWidth={1.5} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Información de Contacto</Typography>
                 </Box>

                 <Paper variant="outlined" sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 3, borderColor: '#e2e8f0', mb: 3 }}>
                    <Stack spacing={3} sx={{ flexDirection: "row", alignItems: "center", mb: 2 }}>
                       <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 20 }}>
                          {customer.name?.[0]?.toUpperCase() || "C"}
                       </Box>
                       <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>{customer.name}</Typography>
                          <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>{customer.email || "Sin correo"}</Typography>
                       </Box>
                    </Stack>
                    <Stack spacing={3} sx={{ flexDirection: "row" }}>
                       {customer.rfc && (
                          <Typography sx={{ color: '#475569', fontSize: '0.875rem' }}><Typography component="span" sx={{ fontWeight: 600 }}>RFC:</Typography> {customer.rfc}</Typography>
                       )}
                       {customer.phone && (
                          <Typography sx={{ color: '#475569', fontSize: '0.875rem' }}><Typography component="span" sx={{ fontWeight: 600 }}>Teléfono:</Typography> {customer.phone}</Typography>
                       )}
                    </Stack>
                 </Paper>

                 <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                       <Typography sx={{ color: '#64748b', fontWeight: 500 }}>Razón Social:</Typography>
                       <Typography sx={{ color: '#1e293b', fontWeight: 500 }}>{customer.razonSocial || "—"}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                       <Typography sx={{ color: '#64748b', fontWeight: 500 }}>Uso CFDI:</Typography>
                       <Typography sx={{ color: '#1e293b', fontWeight: 500 }}>{customer.usoCFDI || "—"}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                       <Typography sx={{ color: '#64748b', fontWeight: 500 }}>Régimen Fiscal:</Typography>
                       <Typography sx={{ color: '#1e293b', fontWeight: 500 }}>{customer.taxRegime || "—"}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                       <Typography sx={{ color: '#64748b', fontWeight: 500 }}>Dirección:</Typography>
                       <Typography sx={{ color: '#1e293b', fontWeight: 500 }}>{customer.address || "—"}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                       <Typography sx={{ color: '#64748b', fontWeight: 500 }}>Domicilio Fiscal:</Typography>
                       <Typography sx={{ color: '#1e293b', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{customer.fiscalAddress || "—"}</Typography>
                    </Box>
                 </Stack>
              </Paper>
           </Grid>

           {/* Información Comercial */}
           <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0', height: '100%' }}>
                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <Briefcase size={18} color="#64748b" strokeWidth={1.5} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Información Comercial</Typography>
                 </Box>

                 <Stack spacing={2}>
                    <Paper variant="outlined" sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 3, borderColor: '#e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <Typography sx={{ color: '#475569', fontWeight: 500 }}>Cliente desde</Typography>
                       <Typography sx={{ color: '#1e293b', fontWeight: 700 }}>
                          {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                       </Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 3, borderColor: '#e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <Typography sx={{ color: '#475569', fontWeight: 500 }}>Total de ventas</Typography>
                       <Typography sx={{ color: '#1e293b', fontWeight: 700 }}>{customer.sales.length}</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 3, borderColor: '#e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <Typography sx={{ color: '#475569', fontWeight: 500 }}>Monto total</Typography>
                       <Typography sx={{ color: '#10b981', fontWeight: 800 }}>{formatCurrency(totalSales)}</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 3, borderColor: '#e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <Typography sx={{ color: '#475569', fontWeight: 500 }}>Última compra</Typography>
                       <Typography sx={{ color: '#1e293b', fontWeight: 700 }}>
                          {customer.sales.length > 0 ? formatDate(new Date(Math.max(...customer.sales.map((s) => new Date(s.date).getTime())))) : "Nunca"}
                       </Typography>
                    </Paper>
                 </Stack>
              </Paper>
           </Grid>
        </Grid>

        {/* Historial de ventas */}
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, borderColor: '#e2e8f0', mb: 4 }}>
           <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 2, mb: 4 }}>
              <ShoppingBag size={18} color="#64748b" strokeWidth={1.5} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                 Historial de Ventas ({customer.sales.length})
              </Typography>
           </Stack>

           {customer.sales.length > 0 ? (
             <TableContainer>
                <Table>
                   <TableHead>
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                         <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Fecha</TableCell>
                         <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Productos</TableCell>
                         <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Total</TableCell>
                         <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Estado</TableCell>
                      </TableRow>
                   </TableHead>
                   <TableBody>
                      {customer.sales.map((sale) => (
                         <TableRow key={sale.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell>
                               <Typography sx={{ fontWeight: 500, color: '#1e293b' }}>{formatDate(sale.date)}</Typography>
                            </TableCell>
                            <TableCell>
                               <Typography sx={{ fontWeight: 500, color: '#1e293b' }}>{sale.saleItems.length} producto(s)</Typography>
                               <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                                 {sale.saleItems.slice(0, 2).map((item, idx) => (
                                    <span key={item.id}>{item.product?.name || "Producto"}{idx < Math.min(2, sale.saleItems.length) - 1 && ", "}</span>
                                  ))}
                                  {sale.saleItems.length > 2 && <span style={{ fontWeight: 600 }}> +{sale.saleItems.length - 2}</span>}
                               </Typography>
                            </TableCell>
                            <TableCell>
                               <Typography sx={{ fontWeight: 700, color: '#10b981' }}>{formatCurrency(sale.totalAmount)}</Typography>
                            </TableCell>
                            <TableCell>{getStatusBadge(sale.status)}</TableCell>
                         </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </TableContainer>
           ) : (
             <Box sx={{ py: 8, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 3 }}>
                <ShoppingBag size={48} color="#cbd5e1" strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
                <Typography sx={{ color: '#64748b' }}>No se han registrado ventas para este cliente</Typography>
             </Box>
           )}
        </Paper>

      </Box>

      {/* Edit Modal (MUI Dialog) */}
      {showEditModal && (
        <EditCustomerModal customer={customer} onClose={() => setShowEditModal(false)} onCustomerUpdated={handleEdit} />
      )}
    </Box>
  );
}

function EditCustomerModal({ customer, onClose, onCustomerUpdated }: { customer: CustomerDetails; onClose: () => void; onCustomerUpdated: (customer: CustomerDetails) => void; }) {
  const [form, setForm] = useState({
    name: customer.name, razonSocial: customer.razonSocial || "", email: customer.email || "", phone: customer.phone || "",
    address: customer.address || "", rfc: customer.rfc || "", usoCFDI: customer.usoCFDI || "", taxRegime: customer.taxRegime || "",
    fiscalAddress: customer.fiscalAddress || "", fiscalStreet: customer.fiscalStreet || "", fiscalExteriorNumber: customer.fiscalExteriorNumber || "",
    fiscalInteriorNumber: customer.fiscalInteriorNumber || "", fiscalNeighborhood: customer.fiscalNeighborhood || "", fiscalPostalCode: customer.fiscalPostalCode || "",
    fiscalCity: customer.fiscalCity || "", fiscalState: customer.fiscalState || "", fiscalMunicipality: customer.fiscalMunicipality || "", fiscalCountry: customer.fiscalCountry || "México",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFiscalInfo, setShowFiscalInfo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.razonSocial.trim() || !form.rfc.trim()) {
      toast.error("Los campos Nombre, Razón Social y RFC son obligatorios"); return;
    }
    setLoading(true); setError("");

    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form), credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al actualizar cliente");
      }

      const data = await res.json();
      onCustomerUpdated({ ...customer, ...data.customer });
    } catch (err) {
      console.error("Error updating customer:", err);
      const message = err instanceof Error ? err.message : "Error al actualizar el cliente";
      setError(message); toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: any) => { setForm((prev) => ({ ...prev, [e.target.name]: e.target.value })); };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 3, p: 2 } } }}>
       <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Editar Cliente</Typography>
       </DialogTitle>
       <DialogContent dividers sx={{ borderColor: '#e2e8f0', p: 4 }}>
          <form id="edit-customer-form" onSubmit={handleSubmit}>
            <Stack spacing={4}>
               {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

               <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                     <TextField fullWidth label="Nombre del Cliente *" name="name" value={form.name} onChange={handleChange} required variant="outlined" />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                     <TextField fullWidth label="Razón Social (Nombre Fiscal) *" name="razonSocial" value={form.razonSocial} onChange={handleChange} required variant="outlined" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                     <TextField fullWidth label="Email" type="email" name="email" value={form.email} onChange={handleChange} variant="outlined" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                     <TextField fullWidth label="Teléfono" type="tel" name="phone" value={form.phone} onChange={handleChange} variant="outlined" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                     <TextField fullWidth label="RFC *" name="rfc" value={form.rfc} onChange={handleChange} required variant="outlined" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}></Grid>
               </Grid>
               
               <Box>
                  <Button onClick={() => setShowFiscalInfo(!showFiscalInfo)} endIcon={showFiscalInfo ? <ChevronUp size={18} /> : <ChevronDown size={18} />} sx={{ textTransform: 'none', color: '#64748b' }}>
                     {showFiscalInfo ? 'Ocultar información fiscal' : 'Mostrar información fiscal'}
                  </Button>
               </Box>

               {showFiscalInfo && (
                  <Grid container spacing={3}>
                     <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth required>
                           <InputLabel>Uso de CFDI</InputLabel>
                           <Select name="usoCFDI" value={form.usoCFDI} onChange={handleChange} label="Uso de CFDI">
                              <MenuItem value=""><em>Seleccionar uso</em></MenuItem>
                              <MenuItem value="G01">G01 - Adquisición de mercancías</MenuItem>
                              <MenuItem value="G03">G03 - Gastos en general</MenuItem>
                              <MenuItem value="I01">I01 - Construcciones</MenuItem>
                              <MenuItem value="I04">I04 - Equipo de cómputo y accesorios</MenuItem>
                              <MenuItem value="I08">I08 - Otra maquinaria y equipo</MenuItem>
                              <MenuItem value="S01">S01 - Sin efectos fiscales</MenuItem>
                           </Select>
                        </FormControl>
                     </Grid>
                     <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth required>
                           <InputLabel>Régimen Fiscal</InputLabel>
                           <Select name="taxRegime" value={form.taxRegime} onChange={handleChange} label="Régimen Fiscal">
                              <MenuItem value=""><em>Seleccionar régimen</em></MenuItem>
                              <MenuItem value="601">601 - General de Ley Personas Morales</MenuItem>
                              <MenuItem value="612">612 - Personas Físicas con Actividades Empresariales</MenuItem>
                              <MenuItem value="621">621 - Incorporación Fiscal</MenuItem>
                              <MenuItem value="626">626 - Régimen Simplificado de Confianza</MenuItem>
                              <MenuItem value="616">616 - Sin obligaciones fiscales</MenuItem>
                           </Select>
                        </FormControl>
                     </Grid>
                     <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Calle" name="fiscalStreet" value={form.fiscalStreet} onChange={handleChange} variant="outlined" /></Grid>
                     <Grid size={{ xs: 12, sm: 3 }}><TextField fullWidth label="No. Ext." name="fiscalExteriorNumber" value={form.fiscalExteriorNumber} onChange={handleChange} variant="outlined" /></Grid>
                     <Grid size={{ xs: 12, sm: 3 }}><TextField fullWidth label="No. Int." name="fiscalInteriorNumber" value={form.fiscalInteriorNumber} onChange={handleChange} variant="outlined" /></Grid>
                     <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Colonia" name="fiscalNeighborhood" value={form.fiscalNeighborhood} onChange={handleChange} variant="outlined" /></Grid>
                     <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="C.P." name="fiscalPostalCode" value={form.fiscalPostalCode} onChange={handleChange} variant="outlined" /></Grid>
                     <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Ciudad" name="fiscalCity" value={form.fiscalCity} onChange={handleChange} variant="outlined" /></Grid>
                     <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Estado" name="fiscalState" value={form.fiscalState} onChange={handleChange} variant="outlined" /></Grid>
                     <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Municipio" name="fiscalMunicipality" value={form.fiscalMunicipality} onChange={handleChange} variant="outlined" /></Grid>
                     <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="País" name="fiscalCountry" value={form.fiscalCountry} onChange={handleChange} variant="outlined" /></Grid>
                     <Grid size={{ xs: 12 }}><TextField fullWidth label="Domicilio Completo" name="fiscalAddress" value={form.fiscalAddress} onChange={handleChange} multiline rows={2} variant="outlined" /></Grid>
                  </Grid>
               )}
            </Stack>
          </form>
       </DialogContent>
       <DialogActions sx={{ p: 4, pt: 1 }}>
          <Button 
            onClick={onClose} 
            variant="outlined" 
            sx={{ textTransform: 'none', borderRadius: 2, color: '#64748b', borderColor: '#cbd5e1', fontWeight: 600, px: 3, py: 1 }}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            form="edit-customer-form" 
            variant="contained" 
            disabled={loading} 
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null} 
            sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#0f172a', fontWeight: 600, px: 4, py: 1, boxShadow: 0, '&:hover': { bgcolor: '#1e293b', boxShadow: 0 } }}
          >
             {loading ? 'Guardando...' : 'Actualizar Cliente'}
          </Button>
       </DialogActions>
    </Dialog>
  );
}
