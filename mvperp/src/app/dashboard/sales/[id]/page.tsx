// src/app/dashboard/sales/[id]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Sale } from "@/types/sale";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

export default function SaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  const saleId = params.id as string;

  useEffect(() => {
    if (saleId) {
      fetchSale();
    }
  }, [saleId]);

  const fetchSale = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/sales/${saleId}`, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Venta no encontrada");
        }
        throw new Error("Error al cargar la venta");
      }

      const data = await res.json();
      setSale(data.sale);
    } catch (err) {
      console.error("Error fetching sale:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta venta?")) {
      return;
    }

    try {
      const res = await fetch(`/api/sales/${saleId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al eliminar");
      }

      router.push("/dashboard/sales");
      router.refresh();
    } catch (err) {
      console.error("Error deleting sale:", err);
      alert(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const handlePrint = () => {
    if (!ticketRef.current) return;

    const printContent = ticketRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=80mm,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket de Venta</title>
        <style>
          @media print {
            body {
              width: 80mm;
              margin: 0;
              padding: 2mm;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.2;
            }
            .ticket-container {
              width: 76mm;
              max-width: 76mm;
            }
            .header {
              text-align: center;
              margin-bottom: 3mm;
              border-bottom: 1px dashed #000;
              padding-bottom: 2mm;
            }
            .company-name {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 1mm;
            }
            .company-info {
              font-size: 10px;
              margin-bottom: 1mm;
            }
            .section {
              margin: 2mm 0;
              border-bottom: 1px dashed #ccc;
              padding-bottom: 1mm;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 2mm 0;
            }
            .items-table td {
              padding: 1mm 0;
              border-bottom: 1px dotted #ccc;
            }
            .items-table .description {
              width: 60%;
            }
            .items-table .quantity {
              width: 15%;
              text-align: center;
            }
            .items-table .price {
              width: 25%;
              text-align: right;
            }
            .total {
              font-weight: bold;
              border-top: 2px solid #000;
              padding-top: 2mm;
              margin-top: 2mm;
            }
            .footer {
              text-align: center;
              margin-top: 4mm;
              border-top: 1px dashed #000;
              padding-top: 2mm;
              font-size: 10px;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-bold { font-weight: bold; }
            .cut-line {
              border-top: 1px dashed #000;
              margin: 5mm 0;
              text-align: center;
            }
          }
        </style>
      </head>
      <body onload="window.print(); window.onafterprint = function() { window.close(); }">
        ${printContent}
      </body>
      </html>
    `);

    printWindow.document.close();
  };

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

  // Componente PDF dentro del mismo archivo
  const SalePDFDocument = () => {
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

    if (!sale) return null;

    const subtotal = sale.totalAmount;
    const iva = sale.totalAmount * 0.16;
    const total = sale.totalAmount * 1.16;

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
          <Text style={styles.title}>COMPROBANTE DE VENTA</Text>

          {/* Información de la venta y cliente */}
          <View style={styles.grid}>
            <View style={styles.gridColumn}>
              <Text style={styles.sectionTitle}>Información de la Venta</Text>
              <Text style={styles.text}>
                <Text style={styles.boldText}>No. de Venta:</Text>{" "}
                {sale.id?.slice(0, 8)}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.boldText}>Fecha:</Text>{" "}
                {formatDate(sale.date)}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.boldText}>Estado:</Text>{" "}
                {sale.status === "completed"
                  ? "COMPLETADA"
                  : sale.status === "cancelled"
                    ? "CANCELADA"
                    : "REEMBOLSADA"}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.boldText}>Vendedor:</Text>{" "}
                {sale.user?.name || "No especificado"}
              </Text>
            </View>

            <View style={styles.gridColumn}>
              <Text style={styles.sectionTitle}>Información del Cliente</Text>
              <Text style={styles.text}>
                <Text style={styles.boldText}>Nombre:</Text>{" "}
                {sale.customer?.name || "VENTA GENERAL"}
              </Text>
              {sale.customer?.email && (
                <Text style={styles.text}>
                  <Text style={styles.boldText}>Email:</Text>{" "}
                  {sale.customer.email}
                </Text>
              )}
              {sale.customer?.phone && (
                <Text style={styles.text}>
                  <Text style={styles.boldText}>Teléfono:</Text>{" "}
                  {sale.customer.phone}
                </Text>
              )}
              {sale.customer?.rfc && (
                <Text style={styles.text}>
                  <Text style={styles.boldText}>RFC:</Text> {sale.customer.rfc}
                </Text>
              )}
            </View>
          </View>

          {/* Notas */}
          {sale.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notas</Text>
              <Text style={styles.text}>{sale.notes}</Text>
            </View>
          )}

          {/* Productos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Productos</Text>
            <View style={styles.table}>
              {/* Encabezado de la tabla */}
              <View style={styles.tableHeader}>
                <Text
                  style={[
                    styles.tableCell,
                    styles.productCell,
                    styles.boldText,
                  ]}
                >
                  Producto
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    styles.quantityCell,
                    styles.boldText,
                  ]}
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
              {sale.saleItems.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.productCell]}>
                    {item.product?.name || "Producto no disponible"}
                    {item.product?.sku && `\nSKU: ${item.product.sku}`}
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
                  style={[
                    styles.tableCell,
                    styles.productCell,
                    styles.boldText,
                  ]}
                ></Text>
                <Text
                  style={[
                    styles.tableCell,
                    styles.quantityCell,
                    styles.boldText,
                  ]}
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
            <Text>¡Gracias por su compra!</Text>
            <Text>
              Este documento es un comprobante de venta. Consérvelo para
              cualquier aclaración.
            </Text>
            <Text style={{ marginTop: 10 }}>
              Generado el {new Date().toLocaleDateString("es-MX")}
            </Text>
          </View>
        </Page>
      </Document>
    );
  };

  const handleDownloadPDF = async () => {
    if (!sale) return;

    setGeneratingPdf(true);
    try {
      // Crear el blob del PDF usando @react-pdf/renderer
      const blob = await pdf(<SalePDFDocument />).toBlob();

      // Crear URL para descargar
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `venta-${saleId.slice(0, 8)}.pdf`;
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

  const formatDateForTicket = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
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
          href="/dashboard/sales"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Volver a ventas
        </Link>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          No se pudo cargar la información de la venta
        </div>
        <Link
          href="/dashboard/sales"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Volver a ventas
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
            href="/dashboard/sales"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Volver a ventas
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            Venta #{sale.id?.slice(0, 8)}
          </h1>
          <p className="text-gray-600">{formatDate(sale.date)}</p>
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
            Imprimir Ticket
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Contenedor oculto para la impresión del ticket */}
      <div ref={ticketRef} className="hidden">
        <div className="ticket-container">
          <div className="header">
            <div className="company-name">MI EMPRESA</div>
            <div className="company-info">RFC: XXXX010101XXX</div>
            <div className="company-info">Tel: (123) 456-7890</div>
            <div className="company-info">www.miempresa.com</div>
          </div>

          <div className="section text-center">
            <div className="text-bold">TICKET DE VENTA</div>
            <div>No: {sale.id?.slice(0, 8)}</div>
            <div>Fecha: {formatDateForTicket(sale.date)}</div>
          </div>

          <div className="section">
            <div className="text-bold">CLIENTE:</div>
            <div>{sale.customer?.name || "VENTA GENERAL"}</div>
            {sale.customer?.rfc && <div>RFC: {sale.customer.rfc}</div>}
          </div>

          <div className="section">
            <div className="text-bold">PRODUCTOS:</div>
            <table className="items-table">
              <tbody>
                {sale.saleItems.map((item, index) => (
                  <tr key={index}>
                    <td className="description">
                      {item.product?.name || "Producto"}
                      {item.quantity > 1 && ` x${item.quantity}`}
                    </td>
                    <td className="quantity"></td>
                    <td className="price">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="section text-right">
            <div>Subtotal: {formatCurrency(sale.totalAmount)}</div>
            <div>IVA: {formatCurrency(sale.totalAmount * 0.16)}</div>
            <div className="total">
              TOTAL: {formatCurrency(sale.totalAmount * 1.16)}
            </div>
          </div>

          <div className="section">
            <div className="text-bold">FORMA DE PAGO:</div>
            <div>EFECTIVO</div>
          </div>

          <div className="footer">
            <div>¡Gracias por su compra!</div>
            <div>*** Este ticket es su comprobante ***</div>
            <div className="cut-line">--- corte aquí ---</div>
            <div>Original - Cliente</div>
          </div>
        </div>
      </div>

      {/* Información de la venta (visualización normal) */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Información de la Venta
            </h3>
            <div className="space-y-2">
              <p>
                <span className="font-medium">No. de Venta:</span>{" "}
                {sale.id?.slice(0, 8)}
              </p>
              <p>
                <span className="font-medium">Fecha:</span>{" "}
                {formatDate(sale.date)}
              </p>
              <p>
                <span className="font-medium">Estado:</span>
                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-200">
                  {sale.status === "completed"
                    ? "COMPLETADA"
                    : sale.status === "cancelled"
                      ? "CANCELADA"
                      : "REEMBOLSADA"}
                </span>
              </p>
              <p>
                <span className="font-medium">Vendedor:</span>{" "}
                {sale.user?.name || "No especificado"}
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
                {sale.customer?.name || "VENTA GENERAL"}
              </p>
              {sale.customer?.email && (
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {sale.customer.email}
                </p>
              )}
              {sale.customer?.phone && (
                <p>
                  <span className="font-medium">Teléfono:</span>{" "}
                  {sale.customer.phone}
                </p>
              )}
              {sale.customer?.rfc && (
                <p>
                  <span className="font-medium">RFC:</span> {sale.customer.rfc}
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
              {sale.saleItems.map((item) => (
                <tr key={item.id}>
                  <td className="border border-gray-300 px-4 py-3">
                    {item.product?.name || "Producto no disponible"}
                    {item.product?.sku && (
                      <div className="text-sm text-gray-600">
                        SKU: {item.product.sku}
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
                  {formatCurrency(sale.totalAmount)}
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
                  {formatCurrency(sale.totalAmount * 0.16)}
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
                  {formatCurrency(sale.totalAmount * 1.16)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {sale.notes && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Notas</h3>
            <p className="bg-gray-100 p-4 rounded-lg">{sale.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
