"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Quotation } from "@/types/sale";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
    borderBottom: "1px solid #000",
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  companyInfo: {
    fontSize: 10,
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  gridColumn: {
    width: "48%",
  },
  text: {
    fontSize: 10,
    marginBottom: 4,
  },
  boldText: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
  },
  table: {
    width: "100%",
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #eee",
    paddingVertical: 5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    borderBottom: "1px solid #000",
  },
  tableCell: {
    fontSize: 9,
    paddingHorizontal: 4,
  },
  productCell: {
    width: "40%",
  },
  quantityCell: {
    width: "15%",
    textAlign: "center",
  },
  priceCell: {
    width: "20%",
    textAlign: "right",
  },
  totalCell: {
    width: "25%",
    textAlign: "right",
  },
  tableFooter: {
    flexDirection: "row",
    backgroundColor: "#f8f8f8",
    paddingVertical: 8,
    borderTop: "2px solid #000",
  },
  footer: {
    textAlign: "center",
    marginTop: 20,
    borderTop: "1px solid #000",
    paddingTop: 10,
    fontSize: 9,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTop: "1px solid #000",
    marginTop: 4,
    fontWeight: "bold",
  },
});

// Componente PDF
const QuotationPDFDocument = ({ quotation }: { quotation: Quotation }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const subtotal = quotation.totalAmount;
  const iva = quotation.totalAmount * 0.16;
  const total = quotation.totalAmount * 1.16;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Encabezado */}
        <View style={styles.header}>
          <Text style={styles.companyName}>MI EMPRESA</Text>
          <Text style={styles.companyInfo}>RFC: XXXX010101XXX</Text>
          <Text style={styles.companyInfo}>Tel: (123) 456-7890</Text>
          <Text style={styles.companyInfo}>www.miempresa.com</Text>
        </View>

        {/* Título */}
        <Text style={styles.title}>COTIZACIÓN</Text>

        {/* Información de la cotización y cliente */}
        <View style={styles.grid}>
          <View style={styles.gridColumn}>
            <Text style={styles.sectionTitle}>
              Información de la Cotización
            </Text>
            <Text style={styles.text}>
              <Text style={styles.boldText}>No. de Cotización:</Text>{" "}
              {quotation.id?.slice(0, 8)}
            </Text>
            <Text style={styles.text}>
              <Text style={styles.boldText}>Fecha:</Text>{" "}
              {formatDate(quotation.date)}
            </Text>
            <Text style={styles.text}>
              <Text style={styles.boldText}>Vencimiento:</Text>{" "}
              {quotation.expiryDate
                ? formatDate(quotation.expiryDate)
                : "Sin vencimiento"}
            </Text>
            <Text style={styles.text}>
              <Text style={styles.boldText}>Estado:</Text>{" "}
              {quotation.status === "pending"
                ? "PENDIENTE"
                : quotation.status === "accepted"
                  ? "ACEPTADA"
                  : quotation.status === "rejected"
                    ? "RECHAZADA"
                    : quotation.status === "expired"
                      ? "EXPIRADA"
                      : "CONVERTIDA"}
            </Text>
          </View>

          <View style={styles.gridColumn}>
            <Text style={styles.sectionTitle}>Información del Cliente</Text>
            <Text style={styles.text}>
              <Text style={styles.boldText}>Nombre:</Text>{" "}
              {quotation.customer?.name || "Cliente no disponible"}
            </Text>
            {quotation.customer?.email && (
              <Text style={styles.text}>
                <Text style={styles.boldText}>Email:</Text>{" "}
                {quotation.customer.email}
              </Text>
            )}
            {quotation.customer?.phone && (
              <Text style={styles.text}>
                <Text style={styles.boldText}>Teléfono:</Text>{" "}
                {quotation.customer.phone}
              </Text>
            )}
            {quotation.customer?.rfc && (
              <Text style={styles.text}>
                <Text style={styles.boldText}>RFC:</Text>{" "}
                {quotation.customer.rfc}
              </Text>
            )}
          </View>
        </View>

        {/* Notas */}
        {quotation.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Text style={styles.text}>{quotation.notes}</Text>
          </View>
        )}

        {/* Productos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos y Servicios</Text>
          <View style={styles.table}>
            {/* Encabezado de la tabla */}
            <View style={styles.tableHeader}>
              <Text
                style={[styles.tableCell, styles.productCell, styles.boldText]}
              >
                Producto
              </Text>
              <Text
                style={[styles.tableCell, styles.quantityCell, styles.boldText]}
              >
                Cantidad
              </Text>
              <Text
                style={[styles.tableCell, styles.priceCell, styles.boldText]}
              >
                Precio Unitario
              </Text>
              <Text
                style={[styles.tableCell, styles.totalCell, styles.boldText]}
              >
                Total
              </Text>
            </View>

            {/* Productos */}
            {quotation.quotationItems.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.productCell]}>
                  {item.product?.name || "Producto no disponible"}
                  {item.description && `\n${item.description}`}
                </Text>
                <Text style={[styles.tableCell, styles.quantityCell]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.tableCell, styles.priceCell]}>
                  {formatCurrency(item.unitPrice)}
                </Text>
                <Text style={[styles.tableCell, styles.totalCell]}>
                  {formatCurrency(item.totalPrice)}
                </Text>
              </View>
            ))}

            {/* Totales */}
            <View style={styles.tableFooter}>
              <Text
                style={[styles.tableCell, styles.productCell, styles.boldText]}
              ></Text>
              <Text
                style={[styles.tableCell, styles.quantityCell, styles.boldText]}
              ></Text>
              <Text
                style={[styles.tableCell, styles.priceCell, styles.boldText]}
              >
                Subtotal:
              </Text>
              <Text
                style={[styles.tableCell, styles.totalCell, styles.boldText]}
              >
                {formatCurrency(subtotal)}
              </Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.productCell]}></Text>
              <Text style={[styles.tableCell, styles.quantityCell]}></Text>
              <Text
                style={[styles.tableCell, styles.priceCell, styles.boldText]}
              >
                IVA (16%):
              </Text>
              <Text
                style={[styles.tableCell, styles.totalCell, styles.boldText]}
              >
                {formatCurrency(iva)}
              </Text>
            </View>

            <View style={styles.grandTotal}>
              <Text style={[styles.tableCell, styles.productCell]}></Text>
              <Text style={[styles.tableCell, styles.quantityCell]}></Text>
              <Text
                style={[styles.tableCell, styles.priceCell, styles.boldText]}
              >
                TOTAL:
              </Text>
              <Text
                style={[styles.tableCell, styles.totalCell, styles.boldText]}
              >
                {formatCurrency(total)}
              </Text>
            </View>
          </View>
        </View>

        {/* Pie de página */}
        <View style={styles.footer}>
          <Text>¡Gracias por su preferencia!</Text>
          <Text>
            Esta cotización es válida por 15 días a partir de la fecha de
            emisión
          </Text>
          <Text style={{ marginTop: 10 }}>
            Generado el {new Date().toLocaleDateString("es-MX")}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const quotationId = params.id as string;

  useEffect(() => {
    if (quotationId) {
      fetchQuotation();
    }
  }, [quotationId]);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/quotations/${quotationId}`, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Cotización no encontrada");
        }
        throw new Error("Error al cargar la cotización");
      }

      const data = await res.json();
      setQuotation(data.quotation);
    } catch (err) {
      console.error("Error fetching quotation:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta cotización?")) {
      return;
    }

    try {
      const res = await fetch(`/api/quotations/${quotationId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al eliminar");
      }

      router.push("/dashboard/sales/quotation");
      router.refresh();
    } catch (err) {
      console.error("Error deleting quotation:", err);
      alert(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const handleConvertToSale = async () => {
    if (!quotation) return;

    if (!confirm("¿Convertir esta cotización en una venta?")) {
      return;
    }

    try {
      const saleData = {
        customerId: quotation.customerId,
        saleItems: quotation.quotationItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          satProductKey: item.satProductKey,
          satUnitKey: item.satUnitKey,
          description: item.description,
        })),
        notes: `Convertido desde cotización ${quotation.id?.slice(0, 8)}`,
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al crear la venta");
      }

      // Actualizar estado de la cotización
      await fetch(`/api/quotations/${quotation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "converted" }),
        credentials: "include",
      });

      alert("Cotización convertida a venta exitosamente");
      router.push("/dashboard/sales");
    } catch (err) {
      console.error("Error converting quotation:", err);
      alert(err instanceof Error ? err.message : "Error al convertir");
    }
  };

  const handleDownloadPDF = async () => {
    if (!quotation) return;

    setGeneratingPdf(true);
    try {
      // Crear el blob del PDF usando @react-pdf/renderer
      const blob = await pdf(
        <QuotationPDFDocument quotation={quotation} />
      ).toBlob();

      // Crear URL para descargar
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cotizacion-${quotationId.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error al generar el PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    if (!quotation) return;

    // Para imprimir, generamos el PDF y lo abrimos en nueva ventana
    const printPDF = async () => {
      try {
        const blob = await pdf(
          <QuotationPDFDocument quotation={quotation} />
        ).toBlob();
        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url, "_blank");
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      } catch (error) {
        console.error("Error printing PDF:", error);
        alert("Error al imprimir");
      }
    };

    printPDF();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pendiente" },
      accepted: { color: "bg-green-100 text-green-800", label: "Aceptada" },
      rejected: { color: "bg-red-100 text-red-800", label: "Rechazada" },
      expired: { color: "bg-gray-100 text-gray-800", label: "Expirada" },
      converted: { color: "bg-blue-100 text-blue-800", label: "Convertida" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 text-sm rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <Link
          href="/dashboard/sales/quotation"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Volver a cotizaciones
        </Link>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          No se pudo cargar la información de la cotización
        </div>
        <Link
          href="/dashboard/sales/quotation"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Volver a cotizaciones
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <Link
            href="/dashboard/sales/quotation"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Volver a cotizaciones
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            Cotización #{quotation.id?.slice(0, 8)}
          </h1>
          <p className="text-gray-600">{formatDate(quotation.date)}</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleDownloadPDF}
            disabled={generatingPdf}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {generatingPdf ? "Generando PDF..." : "Descargar PDF"}
          </button>
          <button
            onClick={handlePrint}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m4 4h6a2 2 0 002-2v-4a2 2 0 00-2-2h-6a2 2 0 00-2 2v4a2 2 0 002 2z"
              />
            </svg>
            Imprimir
          </button>
          {quotation.status === "pending" && (
            <button
              onClick={handleConvertToSale}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Convertir a Venta
            </button>
          )}
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Información de la cotización */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Información de la Cotización
            </h3>
            <div className="space-y-2">
              <p>
                <span className="font-medium">No. de Cotización:</span>{" "}
                {quotation.id?.slice(0, 8)}
              </p>
              <p>
                <span className="font-medium">Fecha:</span>{" "}
                {formatDate(quotation.date)}
              </p>
              <p>
                <span className="font-medium">Vencimiento:</span>{" "}
                {quotation.expiryDate
                  ? formatDate(quotation.expiryDate)
                  : "Sin vencimiento"}
              </p>
              <p>
                <span className="font-medium">Estado:</span>{" "}
                {getStatusBadge(quotation.status)}
              </p>
              <p>
                <span className="font-medium">Vendedor:</span>{" "}
                {quotation.user?.name || "No especificado"}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">
              Información del Cliente
            </h3>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Nombre:</span>{" "}
                {quotation.customer?.name || "Cliente no disponible"}
              </p>
              {quotation.customer?.email && (
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {quotation.customer.email}
                </p>
              )}
              {quotation.customer?.phone && (
                <p>
                  <span className="font-medium">Teléfono:</span>{" "}
                  {quotation.customer.phone}
                </p>
              )}
              {quotation.customer?.rfc && (
                <p>
                  <span className="font-medium">RFC:</span>{" "}
                  {quotation.customer.rfc}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Productos</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-400 px-4 py-3 text-left">
                  Producto
                </th>
                <th className="border border-gray-400 px-4 py-3 text-center">
                  Cantidad
                </th>
                <th className="border border-gray-400 px-4 py-3 text-right">
                  Precio Unitario
                </th>
                <th className="border border-gray-400 px-4 py-3 text-right">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {quotation.quotationItems.map((item) => (
                <tr key={item.id}>
                  <td className="border border-gray-300 px-4 py-3">
                    {item.product?.name || "Producto no disponible"}
                    {item.product?.sku && (
                      <div className="text-sm text-gray-600">
                        SKU: {item.product.sku}
                      </div>
                    )}
                    {item.description && (
                      <div className="text-sm text-gray-600">
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    {item.quantity}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right">
                    {formatCurrency(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100">
                <td
                  colSpan={3}
                  className="border border-gray-400 px-4 py-3 text-right font-semibold"
                >
                  Subtotal:
                </td>
                <td className="border border-gray-400 px-4 py-3 text-right font-semibold">
                  {formatCurrency(quotation.totalAmount)}
                </td>
              </tr>
              <tr className="bg-gray-100">
                <td
                  colSpan={3}
                  className="border border-gray-400 px-4 py-3 text-right font-semibold"
                >
                  IVA (16%):
                </td>
                <td className="border border-gray-400 px-4 py-3 text-right font-semibold">
                  {formatCurrency(quotation.totalAmount * 0.16)}
                </td>
              </tr>
              <tr className="bg-gray-200">
                <td
                  colSpan={3}
                  className="border border-gray-400 px-4 py-3 text-right font-bold text-lg"
                >
                  TOTAL:
                </td>
                <td className="border border-gray-400 px-4 py-3 text-right font-bold text-lg">
                  {formatCurrency(quotation.totalAmount * 1.16)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {quotation.notes && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Notas</h3>
            <p className="bg-gray-100 p-4 rounded-lg">{quotation.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
