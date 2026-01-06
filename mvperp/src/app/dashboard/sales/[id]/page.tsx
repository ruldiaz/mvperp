// src/app/dashboard/sales/[id]/page.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Sale } from "@/types/sale";
import { toast } from "react-hot-toast";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

// Definir tipos para la información de la empresa
interface CompanyInfo {
  id: string;
  name: string;
  rfc: string;
  regime: string;
  csdCert?: string | null;
  csdKey?: string | null;
  csdPassword?: string | null;
  street: string;
  exteriorNumber: string;
  interiorNumber?: string | null;
  neighborhood: string;
  postalCode: string;
  city: string;
  state: string;
  municipality: string;
  country: string;
  email?: string | null;
  phone?: string | null;
  pac?: string | null;
  pacUser?: string | null;
  pacPass?: string | null;
  testMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function SaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [sale, setSale] = useState<Sale | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  const saleId = params.id as string;

  // Función para obtener la información de la empresa
  const fetchCompanyInfo = useCallback(async () => {
    try {
      const res = await fetch("/api/company", {
        credentials: "include",
      });

      if (!res.ok) {
        console.warn("No se pudo obtener información de la empresa");
        return null;
      }

      const data = await res.json();
      return data.company;
    } catch (err) {
      console.error("Error fetching company info:", err);
      return null;
    }
  }, []);

  const fetchSale = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Obtener la información de la empresa y la venta en paralelo
      const [companyRes, saleRes] = await Promise.all([
        fetchCompanyInfo(),
        fetch(`/api/sales/${saleId}`, {
          credentials: "include",
        }),
      ]);

      setCompanyInfo(companyRes);

      if (!saleRes.ok) {
        if (saleRes.status === 404) {
          throw new Error("Venta no encontrada");
        }
        throw new Error("Error al cargar la venta");
      }

      const saleData = await saleRes.json();
      setSale(saleData.sale);
    } catch (err) {
      console.error("Error fetching sale:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      toast.error(
        err instanceof Error ? err.message : "Error al cargar la venta"
      );
    } finally {
      setLoading(false);
    }
  }, [saleId, fetchCompanyInfo]);

  useEffect(() => {
    if (saleId) {
      fetchSale();
    }
  }, [saleId, fetchSale]);

  const handleDelete = async () => {
    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar esta venta? Esta acción no se puede deshacer."
      )
    ) {
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

      toast.success("Venta eliminada exitosamente");
      setTimeout(() => {
        router.push("/dashboard/sales");
      }, 1500);
    } catch (err) {
      console.error("Error deleting sale:", err);
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  // Función para construir la dirección completa
  const getFullAddress = (company: CompanyInfo | null) => {
    if (!company) return "";

    const addressParts = [
      `${company.street} ${company.exteriorNumber}`,
      company.interiorNumber ? `Int. ${company.interiorNumber}` : null,
      company.neighborhood,
      `${company.postalCode} ${company.city}, ${company.state}`,
      company.country,
    ].filter(Boolean);

    return addressParts.join(", ");
  };

  const handlePrint = () => {
    if (!ticketRef.current || !companyInfo) return;

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
    toast.success("Preparando impresión...");
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
    companyAddress: {
      fontSize: 9,
      marginBottom: 2,
      textAlign: "center",
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

  // Componente PDF dentro del mismo archivo - MODIFICADO para recibir companyInfo
  const SalePDFDocument = ({
    sale,
    companyInfo,
  }: {
    sale: Sale;
    companyInfo: CompanyInfo | null;
  }) => {
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

    const subtotal = sale.totalAmount;
    const iva = sale.totalAmount * 0.16;
    const total = sale.totalAmount * 1.16;

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          {/* Encabezado */}
          <View style={styles.header}>
            <Text style={styles.companyName}>
              {companyInfo?.name || "MI EMPRESA"}
            </Text>
            <Text style={styles.companyInfo}>
              RFC: {companyInfo?.rfc || "XXXX010101XXX"}
            </Text>
            {companyInfo?.phone && (
              <Text style={styles.companyInfo}>Tel: {companyInfo.phone}</Text>
            )}
            {companyInfo?.email && (
              <Text style={styles.companyInfo}>Email: {companyInfo.email}</Text>
            )}
            <Text style={styles.companyAddress}>
              {getFullAddress(companyInfo)}
            </Text>
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
      const blob = await pdf(
        <SalePDFDocument sale={sale} companyInfo={companyInfo} />
      ).toBlob();

      // Crear URL para descargar
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `venta-${saleId.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("PDF generado exitosamente");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error al generar el PDF");
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: {
        color: "from-green-100 to-emerald-100 text-green-800",
        label: "COMPLETADA",
        icon: "✅",
      },
      cancelled: {
        color: "from-red-100 to-pink-100 text-red-800",
        label: "CANCELADA",
        icon: "❌",
      },
      refunded: {
        color: "from-amber-100 to-yellow-100 text-amber-800",
        label: "REEMBOLSADA",
        icon: "🔄",
      },
      pending: {
        color: "from-blue-100 to-cyan-100 text-blue-800",
        label: "PENDIENTE",
        icon: "⏳",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: "from-gray-100 to-gray-200 text-gray-800",
      label: status.toUpperCase(),
      icon: "📄",
    };

    return (
      <span
        className={`px-4 py-2 rounded-full font-semibold bg-gradient-to-r ${config.color} flex items-center gap-2`}
      >
        <span>{config.icon}</span>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Cargando detalles de la venta...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
        <Link
          href="/dashboard/sales"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl inline-flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Volver a ventas
        </Link>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 text-yellow-700 px-6 py-4 rounded-xl">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span>No se pudo cargar la información de la venta</span>
          </div>
        </div>
        <Link
          href="/dashboard/sales"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl inline-flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Volver a ventas
        </Link>
      </div>
    );
  }

  const subtotal = sale.totalAmount;
  const iva = sale.totalAmount * 0.16;
  const total = sale.totalAmount * 1.16;
  const totalItems = sale.saleItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <Link
            href="/dashboard/sales"
            className="text-blue-600 hover:text-blue-800 font-medium mb-4 inline-flex items-center gap-2 group"
          >
            <svg
              className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver a ventas
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-800">
              Venta #{sale.id?.slice(0, 8).toUpperCase()}
            </h1>
            {getStatusBadge(sale.status)}
          </div>
          <p className="text-gray-600 mt-2">
            {formatDate(sale.date)}
            {sale.user?.name && ` • Registrada por ${sale.user.name}`}
          </p>
        </div>

        {/* 🆕 BOTONES DE ACCIÓN CON FACTURAR */}
        <div className="flex flex-wrap gap-3">
          {/* Botón Facturar Venta */}
          <Link
            href={`/dashboard/invoices/create?saleId=${sale.id}`}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Facturar Venta
          </Link>

          <button
            onClick={handleDownloadPDF}
            disabled={generatingPdf}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {generatingPdf ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generando...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Descargar PDF
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m4 4h6a2 2 0 002-2v-4a2 2 0 00-2-2h-6a2 2 0 00-2 2v4a2 2 0 002 2z"
              />
            </svg>
            Imprimir Ticket
          </button>

          <button
            onClick={handleDelete}
            className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Eliminar
          </button>
        </div>
      </div>

      {/* Contenedor oculto para la impresión del ticket - MODIFICADO para usar companyInfo */}
      <div ref={ticketRef} className="hidden">
        <div className="ticket-container">
          <div className="header">
            <div className="company-name">
              {companyInfo?.name || "MI EMPRESA"}
            </div>
            <div className="company-info">
              RFC: {companyInfo?.rfc || "XXXX010101XXX"}
            </div>
            {companyInfo?.phone && (
              <div className="company-info">Tel: {companyInfo.phone}</div>
            )}
            {companyInfo?.email && (
              <div className="company-info">Email: {companyInfo.email}</div>
            )}
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

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                Total de la Venta
              </p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {formatCurrency(total)}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                Productos Vendidos
              </p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {sale.saleItems.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">📦</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                Unidades Totales
              </p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {totalItems}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor principal */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Información de la venta */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              Información de la Venta
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg">
                <span className="font-medium text-gray-700">
                  Número de Venta
                </span>
                <span className="font-semibold text-gray-800">
                  #{sale.id?.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg">
                <span className="font-medium text-gray-700">Fecha y Hora</span>
                <span className="font-semibold text-gray-800">
                  {formatDate(sale.date)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg">
                <span className="font-medium text-gray-700">Estado</span>
                {getStatusBadge(sale.status)}
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg">
                <span className="font-medium text-gray-700">
                  Registrada por
                </span>
                <span className="font-semibold text-gray-800">
                  {sale.user?.name || "Sistema"}
                </span>
              </div>
            </div>
          </div>

          {/* Información del cliente */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              Información del Cliente
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                    {sale.customer?.name?.[0]?.toUpperCase() || "C"}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {sale.customer?.name || "Cliente General"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {sale.customer?.email || "Sin correo electrónico"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {sale.customer?.rfc && (
                    <div className="text-sm">
                      <span className="text-gray-600">RFC:</span>
                      <span className="font-medium ml-2">
                        {sale.customer.rfc}
                      </span>
                    </div>
                  )}
                  {sale.customer?.phone && (
                    <div className="text-sm">
                      <span className="text-gray-600">Teléfono:</span>
                      <span className="font-medium ml-2">
                        {sale.customer.phone}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            Productos Vendidos ({sale.saleItems.length})
          </h3>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Precio Unitario
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sale.saleItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                          <span className="font-bold text-blue-600">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {item.product?.name || "Producto no disponible"}
                          </div>
                          {item.product?.sku && (
                            <div className="text-sm text-gray-500">
                              SKU: {item.product.sku}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {item.quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {formatCurrency(item.unitPrice)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-green-600">
                        {formatCurrency(item.totalPrice)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totales */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 mb-6">
          <div className="max-w-md ml-auto">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">IVA (16%):</span>
                <span className="font-medium">{formatCurrency(iva)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-300 pt-3 mt-3">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notas */}
        {sale.notes && (
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              Notas de la Venta
            </h3>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
              <p className="text-gray-700">{sale.notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
