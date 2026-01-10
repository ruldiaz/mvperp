// app/dashboard/invoices/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Invoice } from "@/types/invoice";
import StampInvoiceButton from "@/app/dashboard/components/invoice/StampInvoiceButton";
import CancelInvoiceButton from "@/app/dashboard/components/invoice/CancelInvoiceButton";
import { toast } from "react-hot-toast";
import { ValidationError } from "@/lib/invoiceValidator";

interface ValidationResponse {
  validation: {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
    canStamp: boolean;
    canPreview: boolean;
  };
  invoice: {
    id: string;
    status: string;
    serie?: string | null;
    folio?: string | null;
  };
}

export default function InvoiceDetail() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoices/${params.id}`, {
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 404) throw new Error("Factura no encontrada");
          throw new Error("Error al cargar la factura");
        }

        const data = await res.json();
        setInvoice(data.invoice);
        setError("");
      } catch (err) {
        console.error(err);
        const message =
          err instanceof Error ? err.message : "Error desconocido";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [params.id]);

  const handleStamped = () => {
    router.refresh();
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    setValidationErrors([]);
    setValidationWarnings([]);

    try {
      // First, validate the invoice
      const validateRes = await fetch(
        `/api/invoices/${params.id}/preview?validate=true`,
        {
          credentials: "include",
        }
      );

      if (!validateRes.ok) {
        throw new Error("Error al validar la factura");
      }

      const validateData = (await validateRes.json()) as ValidationResponse;
      const validation = validateData.validation;

      // Store validation results
      if (validation.errors && validation.errors.length > 0) {
        setValidationErrors(
          validation.errors.map((e) => `${e.field}: ${e.message}`)
        );
      }

      if (validation.warnings && validation.warnings.length > 0) {
        setValidationWarnings(
          validation.warnings.map((w) => `${w.field}: ${w.message}`)
        );
      }

      // Show validation results
      if (validation.errors && validation.errors.length > 0) {
        toast.error(
          `La factura tiene ${validation.errors.length} error(es) de validación. Revise los detalles abajo.`
        );
      } else if (validation.warnings && validation.warnings.length > 0) {
        toast.success(
          `Validación exitosa con ${validation.warnings.length} advertencia(s). Puede previsualizar el PDF.`,
          { duration: 4000 }
        );
      } else {
        toast.success("✅ Validación exitosa. Generando previsualización...");
      }

      // Generate and download PDF preview
      const previewRes = await fetch(`/api/invoices/${params.id}/preview`, {
        credentials: "include",
      });

      if (!previewRes.ok) {
        throw new Error("Error al generar la previsualización");
      }

      // Get PDF blob and download
      const blob = await previewRes.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `preview-factura-${invoice?.serie || ""}-${invoice?.folio || invoice?.id?.slice(0, 8) || "temp"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("📄 Previsualización descargada exitosamente");
    } catch (err) {
      console.error("Error previewing invoice:", err);
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast.error(message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount == null) return "$0.00";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const config = {
      stamped: {
        color: "from-green-100 to-emerald-100 text-green-800",
        label: "TIMBRADA",
        icon: "✅",
      },
      pending: {
        color: "from-yellow-100 to-amber-100 text-yellow-800",
        label: "PENDIENTE",
        icon: "⏳",
      },
      cancelled: {
        color: "from-red-100 to-pink-100 text-red-800",
        label: "CANCELADA",
        icon: "❌",
      },
    };
    const selected = config[status as keyof typeof config] || {
      color: "from-gray-100 to-gray-200 text-gray-800",
      label: status.toUpperCase(),
      icon: "📄",
    };
    return (
      <span
        className={`px-4 py-2 rounded-full font-semibold bg-gradient-to-r ${selected.color} flex items-center gap-2`}
      >
        <span>{selected.icon}</span>
        {selected.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex justify-center items-center">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl border border-gray-200 shadow-sm text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">
            Cargando factura...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex justify-center items-center">
        <div className="bg-gradient-to-r from-red-50 to-pink-50 p-8 rounded-2xl border border-red-200 shadow-sm text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <Link
            href="/dashboard/invoices"
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 inline-block"
          >
            ← Volver a facturas
          </Link>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex justify-center items-center">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-8 rounded-2xl border border-gray-200 shadow-sm text-center max-w-md">
          <div className="text-4xl mb-4">🧾</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Factura no encontrada
          </h2>
          <p className="text-gray-600 mb-6">
            La factura que buscas no existe o no tienes acceso
          </p>
          <Link
            href="/dashboard/invoices"
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 inline-block"
          >
            ← Volver a facturas
          </Link>
        </div>
      </div>
    );
  }

  const total = (invoice.subtotal || 0) + (invoice.taxes || 0);
  const totalItems =
    invoice.invoiceItems?.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    ) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="pt-8 pb-8 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-b-2xl shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="text-3xl">🧾</div>
                <div>
                  <h1 className="text-4xl font-bold leading-tight">
                    Factura{" "}
                    {invoice.serie && invoice.folio
                      ? `${invoice.serie}-${invoice.folio}`
                      : `#${invoice.id?.slice(0, 8).toUpperCase()}`}
                  </h1>
                  <div className="flex items-center gap-3 mt-2">
                    {getStatusBadge(invoice.status)}
                    <p className="text-lg text-blue-100">
                      {formatDate(invoice.createdAt)}
                      {invoice.uuid && ` • UUID: ${invoice.uuid.slice(0, 8)}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <Link
              href="/dashboard/invoices"
              className="mt-4 md:mt-0 bg-transparent border-2 border-white text-white px-6 py-2 rounded-lg font-semibold hover:bg-white/10 transition-all duration-200"
            >
              ← Volver a facturas
            </Link>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Facturado</p>
                <p className="text-3xl font-bold text-gray-800">
                  {formatCurrency(total)}
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Conceptos</p>
                <p className="text-3xl font-bold text-gray-800">
                  {invoice.invoiceItems?.length || 0}
                </p>
              </div>
              <div className="text-3xl">📋</div>
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Unidades</p>
                <p className="text-3xl font-bold text-gray-800">{totalItems}</p>
              </div>
              <div className="text-3xl">📦</div>
            </div>
          </div>
        </div>

        {/* Contenedor principal */}
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white">
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Información general */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <div className="text-2xl bg-white p-3 rounded-xl shadow-sm">
                    📋
                  </div>
                  Información General
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50">
                    <span className="font-medium text-gray-700">Estado</span>
                    {getStatusBadge(invoice.status)}
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50">
                    <span className="font-medium text-gray-700">
                      Fecha y Hora
                    </span>
                    <span className="font-semibold text-gray-800">
                      {formatDate(invoice.createdAt)}
                    </span>
                  </div>
                  {invoice.uuid && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50">
                      <span className="font-medium text-gray-700 mb-2 block">
                        UUID
                      </span>
                      <span className="font-mono text-sm text-gray-800">
                        {invoice.uuid}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Información del cliente */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <div className="text-2xl bg-white p-3 rounded-xl shadow-sm">
                    👤
                  </div>
                  Cliente
                </h3>
                <div className="p-6 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-2xl bg-white p-3 rounded-full shadow-sm">
                      {invoice.customer?.name?.[0]?.toUpperCase() || "C"}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">
                        {invoice.customer?.name || "Cliente General"}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {invoice.customer?.email || "Sin correo"}
                      </p>
                    </div>
                  </div>
                  {invoice.customer?.rfc && (
                    <div className="p-3 bg-white/80 rounded-lg">
                      <span className="text-gray-600">RFC:</span>
                      <span className="font-medium ml-2">
                        {invoice.customer.rfc}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Productos/Servicios */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="text-2xl bg-white p-3 rounded-xl shadow-sm">
                  📦
                </div>
                Conceptos ({invoice.invoiceItems?.length || 0})
              </h3>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                      <th className="px-6 py-4 text-left font-semibold">
                        Descripción
                      </th>
                      <th className="px-6 py-4 text-left font-semibold">
                        Cantidad
                      </th>
                      <th className="px-6 py-4 text-left font-semibold">
                        Precio Unitario
                      </th>
                      <th className="px-6 py-4 text-left font-semibold">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.invoiceItems?.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-800">
                            {item.saleItem?.description || "Sin descripción"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-800">{item.quantity}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-800">
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
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="text-2xl bg-white p-3 rounded-xl shadow-sm">
                  💰
                </div>
                Resumen de Totales
              </h3>
              <div className="max-w-md ml-auto">
                <div className="p-6 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-gray-200">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Subtotal:</span>
                      <span className="font-bold text-gray-800">
                        {formatCurrency(invoice.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">IVA (16%):</span>
                      <span className="font-bold text-gray-800">
                        {formatCurrency(invoice.taxes)}
                      </span>
                    </div>
                    <div className="border-t border-gray-300 pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-gray-900">
                          Total:
                        </span>
                        <span className="text-2xl font-bold text-blue-600">
                          {formatCurrency(total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Results */}
        {(validationErrors.length > 0 || validationWarnings.length > 0) && (
          <div className="mt-8 space-y-4">
            {validationErrors.length > 0 && (
              <div className="p-6 rounded-2xl bg-gradient-to-r from-red-50 to-pink-50 border border-red-200">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">❌</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-red-800 mb-2">
                      Errores de Validación ({validationErrors.length})
                    </h3>
                    <p className="text-sm text-red-600 mb-3">
                      Debe corregir estos errores antes de timbrar la factura.
                    </p>
                    <ul className="space-y-2">
                      {validationErrors.map((error, index) => (
                        <li
                          key={index}
                          className="text-sm text-red-700 flex items-start gap-2"
                        >
                          <span className="text-red-500">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {validationWarnings.length > 0 && (
              <div className="p-6 rounded-2xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-yellow-800 mb-2">
                      Advertencias ({validationWarnings.length})
                    </h3>
                    <p className="text-sm text-yellow-600 mb-3">
                      Estas advertencias no bloquean el timbrado, pero se
                      recomienda revisarlas.
                    </p>
                    <ul className="space-y-2">
                      {validationWarnings.map((warning, index) => (
                        <li
                          key={index}
                          className="text-sm text-yellow-700 flex items-start gap-2"
                        >
                          <span className="text-yellow-500">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Acciones */}
        <div className="mt-8 flex flex-wrap gap-4 justify-end">
          {invoice.status === "pending" && (
            <>
              <button
                onClick={handlePreview}
                disabled={previewLoading}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {previewLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🔍</span>
                    Previsualizar Factura
                  </>
                )}
              </button>

              <StampInvoiceButton
                invoiceId={invoice.id!}
                onStamped={handleStamped}
              />
            </>
          )}

          {invoice.status === "stamped" && (
            <>
              <a
                href={`/api/invoices/${invoice.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
              >
                <span className="mr-2">📄</span>
                Descargar PDF
              </a>

              <CancelInvoiceButton
                invoiceId={invoice.id!}
                onCancelled={() => router.refresh()}
              />

              {invoice.verificationUrl && (
                <a
                  href={invoice.verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
                >
                  <span className="mr-2">🔍</span>
                  Verificar en SAT
                </a>
              )}
            </>
          )}

          {invoice.status === "cancelled" && (
            <div className="w-full p-6 rounded-2xl bg-gradient-to-r from-red-50 to-pink-50 border border-red-200">
              <div className="flex items-center gap-3">
                <div className="text-2xl">❌</div>
                <div>
                  <p className="font-semibold text-red-800">
                    Factura cancelada
                  </p>
                  <p className="text-red-600 text-sm">
                    Esta factura ha sido cancelada el{" "}
                    {formatDate(invoice.cancelledAt)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
