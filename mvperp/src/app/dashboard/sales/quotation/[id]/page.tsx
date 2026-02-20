// src/app/dashboard/sales/quotation/[id]/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Quotation } from "@/types/sale";
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

// Componente PDF — MODIFICADO para recibir companyInfo
const QuotationPDFDocument = ({
  quotation,
  companyInfo,
}: {
  quotation: Quotation;
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
    });
  };

  const subtotal = quotation.totalAmount;
  const iva = quotation.totalAmount * 0.16;
  const total = quotation.totalAmount * 1.16;

  // Función para construir la dirección completa
  const getFullAddress = () => {
    if (!companyInfo) return "";

    const addressParts = [
      `${companyInfo.street} ${companyInfo.exteriorNumber}`,
      companyInfo.interiorNumber ? `Int. ${companyInfo.interiorNumber}` : null,
      companyInfo.neighborhood,
      `${companyInfo.postalCode} ${companyInfo.city}, ${companyInfo.state}`,
      companyInfo.country,
    ].filter(Boolean);

    return addressParts.join(", ");
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>{companyInfo?.name}</Text>
          <Text style={styles.companyInfo}>RFC: {companyInfo?.rfc}</Text>
          {companyInfo?.phone && (
            <Text style={styles.companyInfo}>Tel: {companyInfo.phone}</Text>
          )}
          {companyInfo?.email && (
            <Text style={styles.companyInfo}>Email: {companyInfo.email}</Text>
          )}
          <Text style={styles.companyAddress}>{getFullAddress()}</Text>
        </View>

        <Text style={styles.title}>COTIZACIÓN</Text>

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

        {quotation.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Text style={styles.text}>{quotation.notes}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos y Servicios</Text>
          <View style={styles.table}>
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

            {quotation.quotationItems.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.productCell]}>
                  {item.product?.name || "Producto no disponible"}
                  {/*item.description && `\n${item.description}`*/}
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
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const quotationId = params.id as string;

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

  const fetchQuotation = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Obtener la información de la empresa y la cotización en paralelo
      const [companyRes, quotationRes] = await Promise.all([
        fetchCompanyInfo(),
        fetch(`/api/quotations/${quotationId}`, {
          credentials: "include",
        }),
      ]);

      setCompanyInfo(companyRes);

      if (!quotationRes.ok) {
        if (quotationRes.status === 404) {
          throw new Error("Cotización no encontrada");
        }
        throw new Error("Error al cargar la cotización");
      }

      const quotationData = await quotationRes.json();
      setQuotation(quotationData.quotation);
    } catch (err) {
      console.error("Error fetching quotation:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      toast.error(
        err instanceof Error ? err.message : "Error al cargar la cotización"
      );
    } finally {
      setLoading(false);
    }
  }, [quotationId, fetchCompanyInfo]);

  useEffect(() => {
    if (quotationId) {
      fetchQuotation();
    }
  }, [quotationId, fetchQuotation]);

  const handleDelete = async () => {
    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar esta cotización? Esta acción no se puede deshacer."
      )
    ) {
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

      toast.success("Cotización eliminada exitosamente");
      setTimeout(() => {
        router.push("/dashboard/sales/quotation");
      }, 1500);
    } catch (err) {
      console.error("Error deleting quotation:", err);
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
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

      await fetch(`/api/quotations/${quotation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "converted" }),
        credentials: "include",
      });

      toast.success("Cotización convertida a venta exitosamente");
      router.push("/dashboard/sales");
    } catch (err) {
      console.error("Error converting quotation:", err);
      toast.error(err instanceof Error ? err.message : "Error al convertir");
    }
  };

  const handleDownloadPDF = async () => {
    if (!quotation) return;

    setGeneratingPdf(true);
    try {
      const blob = await pdf(
        <QuotationPDFDocument quotation={quotation} companyInfo={companyInfo} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cotizacion-${quotationId.slice(0, 8)}.pdf`;
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

  const handlePrint = () => {
    if (!quotation) return;

    const printPDF = async () => {
      try {
        const blob = await pdf(
          <QuotationPDFDocument
            quotation={quotation}
            companyInfo={companyInfo}
          />
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
        toast.error("Error al imprimir");
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
      pending: {
        color: "from-yellow-100 to-amber-100 text-yellow-800",
        label: "PENDIENTE",
        icon: "⏳",
      },
      accepted: {
        color: "from-green-100 to-emerald-100 text-green-800",
        label: "ACEPTADA",
        icon: "✅",
      },
      rejected: {
        color: "from-red-100 to-pink-100 text-red-800",
        label: "RECHAZADA",
        icon: "❌",
      },
      expired: {
        color: "from-gray-100 to-gray-200 text-gray-800",
        label: "EXPIRADA",
        icon: "🕒",
      },
      converted: {
        color: "from-blue-100 to-indigo-100 text-blue-800",
        label: "CONVERTIDA",
        icon: "🔄",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
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
            Cargando detalles de la cotización...
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
          href="/dashboard/sales/quotation"
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
          Volver a cotizaciones
        </Link>
      </div>
    );
  }

  if (!quotation) {
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
            <span>No se pudo cargar la información de la cotización</span>
          </div>
        </div>
        <Link
          href="/dashboard/sales/quotation"
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
          Volver a cotizaciones
        </Link>
      </div>
    );
  }

  const subtotal = quotation.totalAmount;
  const iva = quotation.totalAmount * 0.16;
  const total = quotation.totalAmount * 1.16;
  const totalItems = quotation.quotationItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <Link
            href="/dashboard/sales/quotation"
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
            Volver a cotizaciones
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-800">
              Cotización #{quotation.id?.slice(0, 8).toUpperCase()}
            </h1>
            {getStatusBadge(quotation.status)}
          </div>
          <p className="text-gray-600 mt-2">
            {formatDate(quotation.date)}
            {quotation.user?.name && ` • Generada por ${quotation.user.name}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
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
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m4 4h6a2 2 0 002-2v-4a2 2 0 00-2-2h-6a2 2 0 00-2 2v4a2 2 0 002 2z"
              />
            </svg>
            Imprimir
          </button>
          {quotation.status === "pending" && (
            <>
              <Link
                href={`/dashboard/sales/quotation/${quotationId}/edit`}
                className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-yellow-600 hover:to-amber-600 transition-all duration-200 flex items-center gap-2"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Editar
              </Link>
              <button
                onClick={handleConvertToSale}
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Convertir a Venta
              </button>
            </>
          )}
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

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                Total Cotizado
              </p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {formatCurrency(total)}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">📄</span>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                Productos/Servicios
              </p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {quotation.quotationItems.length}
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
          {/* Información de la cotización */}
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
              Información de la Cotización
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg">
                <span className="font-medium text-gray-700">
                  Número de Cotización
                </span>
                <span className="font-semibold text-gray-800">
                  #{quotation.id?.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg">
                <span className="font-medium text-gray-700">Fecha y Hora</span>
                <span className="font-semibold text-gray-800">
                  {formatDate(quotation.date)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg">
                <span className="font-medium text-gray-700">Vencimiento</span>
                <span className="font-semibold text-gray-800">
                  {quotation.expiryDate
                    ? new Date(quotation.expiryDate).toLocaleDateString(
                        "es-MX",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )
                    : "Sin vencimiento"}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg">
                <span className="font-medium text-gray-700">Estado</span>
                {getStatusBadge(quotation.status)}
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg">
                <span className="font-medium text-gray-700">Generada por</span>
                <span className="font-semibold text-gray-800">
                  {quotation.user?.name || "Sistema"}
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
                    {quotation.customer?.name?.[0]?.toUpperCase() || "C"}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {quotation.customer?.name || "Cliente General"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {quotation.customer?.email || "Sin correo electrónico"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {quotation.customer?.rfc && (
                    <div className="text-sm">
                      <span className="text-gray-600">RFC:</span>
                      <span className="font-medium ml-2">
                        {quotation.customer.rfc}
                      </span>
                    </div>
                  )}
                  {quotation.customer?.phone && (
                    <div className="text-sm">
                      <span className="text-gray-600">Teléfono:</span>
                      <span className="font-medium ml-2">
                        {quotation.customer.phone}
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
            Productos y Servicios ({quotation.quotationItems.length})
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
                {quotation.quotationItems.map((item, index) => (
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
                          {item.description && (
                            <div className="text-sm text-gray-500 mt-1">
                              {item.description}
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
        {quotation.notes && (
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
              Notas
            </h3>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
              <p className="text-gray-700">{quotation.notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
