import React from "react";
import { Quotation } from "@/types/sale";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

export interface CompanyInfo {
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

export const QuotationPDF = ({ q, company }: { q: Quotation; company: CompanyInfo | null }) => (
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
          <Text style={[pdfStyles.cell, { width: "60%" }]}>{item.description || item.product?.name}</Text>
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

export const downloadQuotationPDF = async (q: Quotation, company: CompanyInfo | null) => {
  const blob = await pdf(<QuotationPDF q={q} company={company} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `COT-${q.id?.slice(0, 8)}.pdf`;
  link.click();
};
