"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Quotation } from "@/types/sale";
import { toast } from "react-hot-toast";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Grid,
} from "@mui/material";
import {
  ArrowLeft,
  Download,
  Printer,
  FileEdit,
  ArrowRightLeft,
  Trash2,
  User,
  Calendar,
  FileText,
  MessageSquare,
  Building2,
} from "lucide-react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

interface CompanyInfo {
  name: string;
  rfc: string;
  street: string;
  exteriorNumber: string;
  interiorNumber?: string | null;
  neighborhood: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
}

const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", color: "#1e293b" },
  header: { marginBottom: 30, borderBottom: "1px solid #e2e8f0", paddingBottom: 20 },
  companyName: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  companyInfo: { fontSize: 9, color: "#64748b", marginTop: 2 },
  title: { fontSize: 24, fontWeight: "bold", marginVertical: 20, textAlign: "right", color: "#334155" },
  infoSection: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  infoBox: { width: "45%" },
  label: { fontSize: 8, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 },
  value: { fontSize: 10, color: "#1e293b", fontWeight: "bold" },
  table: { width: "100%", marginTop: 20 },
  tableHeader: { flexDirection: "row", borderBottom: "1px solid #334155", paddingBottom: 5, marginBottom: 10 },
  tableRow: { flexDirection: "row", borderBottom: "1px solid #f1f5f9", paddingVertical: 8 },
  cell: { fontSize: 9, color: "#334155" },
  totalSection: { marginTop: 30, borderTop: "1px solid #e2e8f0", paddingTop: 15, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", width: "40%", marginBottom: 5 },
  grandTotal: { borderTop: "1px solid #0f172a", paddingTop: 8, marginTop: 5, fontSize: 12, fontWeight: "bold" },
});

const QuotationPDF = ({ q, company }: { q: Quotation; company: CompanyInfo | null }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.companyName}>{company?.name || "EMPRESA"}</Text>
        <Text style={pdfStyles.companyInfo}>RFC: {company?.rfc}</Text>
        <Text style={pdfStyles.companyInfo}>
          {company?.street} {company?.exteriorNumber}, {company?.city}, {company?.state}
        </Text>
      </View>
      <Text style={pdfStyles.title}>COTIZACIÓN</Text>
      <View style={pdfStyles.infoSection}>
        <View style={pdfStyles.infoBox}>
          <Text style={pdfStyles.label}>CLIENTE</Text>
          <Text style={pdfStyles.value}>{q.customer?.name}</Text>
          <Text style={pdfStyles.companyInfo}>RFC: {q.customer?.rfc}</Text>
        </View>
        <View style={[pdfStyles.infoBox, { textAlign: "right" }]}>
          <Text style={pdfStyles.label}>FOLIO</Text>
          <Text style={pdfStyles.value}>#{q.id?.slice(0, 8).toUpperCase()}</Text>
          <Text style={[pdfStyles.label, { marginTop: 10 }]}>FECHA</Text>
          <Text style={pdfStyles.value}>{new Date(q.date).toLocaleDateString()}</Text>
        </View>
      </View>
      <View style={pdfStyles.tableHeader}>
        <Text style={[pdfStyles.cell, { width: "60%" }]}>DESCRIPCIÓN</Text>
        <Text style={[pdfStyles.cell, { width: "10%", textAlign: "center" }]}>CANT</Text>
        <Text style={[pdfStyles.cell, { width: "15%", textAlign: "right" }]}>UNITARIO</Text>
        <Text style={[pdfStyles.cell, { width: "15%", textAlign: "right" }]}>TOTAL</Text>
      </View>
      {q.quotationItems.map((item, i) => (
        <View key={i} style={pdfStyles.tableRow}>
          <Text style={[pdfStyles.cell, { width: "60%" }]}>{item.product?.name}</Text>
          <Text style={[pdfStyles.cell, { width: "10%", textAlign: "center" }]}>{item.quantity}</Text>
          <Text style={[pdfStyles.cell, { width: "15%", textAlign: "right" }]}>{item.unitPrice.toFixed(2)}</Text>
          <Text style={[pdfStyles.cell, { width: "15%", textAlign: "right" }]}>{item.totalPrice.toFixed(2)}</Text>
        </View>
      ))}
      <View style={pdfStyles.totalSection}>
        <View style={pdfStyles.totalRow}>
          <Text style={pdfStyles.cell}>SUBTOTAL</Text>
          <Text style={pdfStyles.cell}>{q.totalAmount.toFixed(2)}</Text>
        </View>
        <View style={pdfStyles.totalRow}>
          <Text style={pdfStyles.cell}>IVA (16%)</Text>
          <Text style={pdfStyles.cell}>{(q.totalAmount * 0.16).toFixed(2)}</Text>
        </View>
        <View style={[pdfStyles.totalRow, pdfStyles.grandTotal]}>
          <Text style={{ fontSize: 11 }}>TOTAL MXN</Text>
          <Text style={{ fontSize: 11 }}>{(q.totalAmount * 1.16).toFixed(2)}</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [q, setQ] = useState<Quotation | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [genPdf, setGenPdf] = useState(false);

  const quotationId = params.id as string;

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [cRes, qRes] = await Promise.all([
        fetch("/api/company", { credentials: "include" }),
        fetch(`/api/quotations/${quotationId}`, { credentials: "include" }),
      ]);
      if (cRes.ok) setCompany((await cRes.json()).company);
      if (qRes.ok) setQ((await qRes.json()).quotation);
      else router.push("/dashboard/sales/quotation");
    } catch (err) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [quotationId, router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDownload = async () => {
    if (!q) return;
    setGenPdf(true);
    try {
      const blob = await pdf(<QuotationPDF q={q} company={company} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `COT-${quotationId.slice(0, 8)}.pdf`;
      link.click();
    } finally {
      setGenPdf(false);
    }
  };

  const handleConvert = async () => {
    if (!q || !confirm("¿Convertir en venta oficial?")) return;
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: q.customerId,
          saleItems: q.quotationItems.map(i => ({
            productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice,
            satProductKey: i.satProductKey, satUnitKey: i.satUnitKey, description: i.description
          })),
          notes: `De cotización ${q.id?.slice(0, 8)}`
        }),
        credentials: "include"
      });
      if (res.ok) {
        await fetch(`/api/quotations/${quotationId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "converted" }),
          credentials: "include"
        });
        toast.success("Venta creada");
        router.push("/dashboard/sales");
      }
    } catch (err) { toast.error("Error al convertir"); }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress size={30} sx={{ color: '#94a3b8' }} /></Box>
  );

  if (!q) return null;

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", py: 6, px: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 6, flexWrap: "wrap", gap: 3 }}>
        <Box>
          <Button
            startIcon={<ArrowLeft size={16} />}
            onClick={() => router.push("/dashboard/sales/quotation")}
            sx={{ color: '#64748b', textTransform: 'none', mb: 2, p: 0, '&:hover': { bgcolor: 'transparent', color: '#1e293b' } }}
          >
            Volver a la lista
          </Button>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em' }}>
              Cotización #{q.id?.slice(0, 8).toUpperCase()}
            </Typography>
            <Box sx={{ 
              px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.7rem', fontWeight: 700,
              bgcolor: q.status === 'pending' ? '#fef3c7' : '#f1f5f9',
              color: q.status === 'pending' ? '#92400e' : '#475569'
            }}>
              {q.status.toUpperCase()}
            </Box>
          </Box>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={genPdf ? <CircularProgress size={14} /> : <Download size={18} />}
            onClick={handleDownload}
            sx={{ borderRadius: 1.5, textTransform: 'none', borderColor: '#cbd5e1', color: '#475569' }}
          >
            Descargar PDF
          </Button>
          {q.status === 'pending' && (
            <>
              <Button
                variant="outlined"
                startIcon={<FileEdit size={18} />}
                component={Link}
                href={`/dashboard/sales/quotation/${quotationId}/edit`}
                sx={{ borderRadius: 1.5, textTransform: 'none', borderColor: '#cbd5e1', color: '#475569' }}
              >
                Editar
              </Button>
              <Button
                variant="contained"
                startIcon={<ArrowRightLeft size={18} />}
                onClick={handleConvert}
                sx={{ borderRadius: 1.5, textTransform: 'none', bgcolor: '#334155', boxShadow: 'none' }}
              >
                Convertir a Venta
              </Button>
            </>
          )}
          <IconButton color="error" onClick={() => { if(confirm("¿Eliminar?")) router.push("/dashboard/sales/quotation"); }} sx={{ bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}>
            <Trash2 size={18} />
          </IconButton>
        </Stack>
      </Box>

      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ borderRadius: 2, borderColor: '#e2e8f0', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <Building2 size={16} color="#64748b" />
                <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Información Comercial</Typography>
              </Box>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Fecha de emisión</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{new Date(q.date).toLocaleDateString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Vencimiento</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{q.expiryDate ? new Date(q.expiryDate).toLocaleDateString() : 'No aplica'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Referencia interna</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{q.id?.slice(0, 12)}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ borderRadius: 2, borderColor: '#e2e8f0', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <User size={16} color="#64748b" />
                <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliente</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 1.5, bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontWeight: 700 }}>
                  {q.customer?.name?.[0]}
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>{q.customer?.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{q.customer?.email}</Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>RFC: {q.customer?.rfc}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, borderColor: '#e2e8f0', overflow: 'hidden', mb: 6 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>DESCRIPCIÓN</TableCell>
              <TableCell align="center" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>CANT.</TableCell>
              <TableCell align="right" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>P. UNITARIO</TableCell>
              <TableCell align="right" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>SUBTOTAL</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {q.quotationItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Typography variant="body2" color="#1e293b" sx={{ fontWeight: 600 }}>{item.product?.name}</Typography>
                  {item.description && <Typography variant="caption" color="text.secondary">{item.description}</Typography>}
                </TableCell>
                <TableCell align="center" sx={{ color: '#475569' }}>{item.quantity}</TableCell>
                <TableCell align="right" sx={{ color: '#475569' }}>{item.unitPrice.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#0f172a' }}>{item.totalPrice.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 7 }}>
          {q.notes && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MessageSquare size={16} color="#64748b" />
                <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Notas y Observaciones</Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6, bgcolor: '#f8fafc', p: 2, borderRadius: 2, border: '1px solid #f1f5f9' }}>
                {q.notes}
              </Typography>
            </Box>
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ p: 3, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Subtotal Neto</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{q.totalAmount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">IVA (16%)</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{(q.totalAmount * 0.16).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ color: '#0f172a', fontWeight: 700 }}>Total General</Typography>
                <Typography variant="h6" sx={{ color: '#0f172a', fontWeight: 800 }}>
                  {(q.totalAmount * 1.16).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
