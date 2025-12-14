"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Quotation } from "@/types/sale";
import { toast } from "react-hot-toast";

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function Quotations() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchQuotations = useCallback(
    async (page = 1, search = "") => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          ...(search && { search }),
        });

        const res = await fetch(`/api/quotations?${params}`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Error al cargar las cotizaciones");

        const data = await res.json();
        setQuotations(data.quotations);
        setPagination(data.pagination);
        setError("");
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar las cotizaciones");
        toast.error("Error al cargar las cotizaciones");
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchQuotations(1, searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchQuotations]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchQuotations(newPage, searchTerm);
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar esta cotización? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al eliminar");
      }

      setQuotations((prev) => prev.filter((quotation) => quotation.id !== id));
      toast.success("Cotización eliminada exitosamente");
    } catch (err) {
      console.error("Error deleting quotation:", err);
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const handleConvertToSale = async (quotation: Quotation) => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        color: "from-yellow-100 to-amber-100 text-yellow-800",
        label: "Pendiente",
        icon: "⏳",
      },
      accepted: {
        color: "from-green-100 to-emerald-100 text-green-800",
        label: "Aceptada",
        icon: "✅",
      },
      rejected: {
        color: "from-red-100 to-pink-100 text-red-800",
        label: "Rechazada",
        icon: "❌",
      },
      expired: {
        color: "from-gray-100 to-gray-200 text-gray-800",
        label: "Expirada",
        icon: "🕒",
      },
      converted: {
        color: "from-blue-100 to-indigo-100 text-blue-800",
        label: "Convertida",
        icon: "🔄",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${config.color} flex items-center gap-1`}
      >
        <span>{config.icon}</span>
        {config.label}
      </span>
    );
  };

  if (loading && quotations.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando cotizaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Cotizaciones</h1>
          <p className="text-gray-600 mt-1">
            Gestiona y convierte tus cotizaciones en ventas
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Buscar por cliente, ID o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
            />
            <svg
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <Link
            href="/dashboard/sales/quotation/create"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Nueva Cotización
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-red-500"
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
      )}

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Vencimiento
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Productos
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotations.map((quotation) => (
                <tr
                  key={quotation.id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-5">
                    <div className="font-bold text-blue-600">
                      #{quotation.id?.slice(0, 8).toUpperCase()}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-gray-700">
                      {formatDate(quotation.date)}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-medium text-gray-800">
                      {quotation.customer?.name || "Cliente General"}
                    </div>
                    {quotation.customer?.email && (
                      <div className="text-sm text-gray-500">
                        {quotation.customer.email}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-gray-600">
                      {quotation.expiryDate
                        ? new Date(quotation.expiryDate).toLocaleDateString(
                            "es-MX",
                            {
                              day: "2-digit",
                              month: "short",
                            }
                          )
                        : "—"}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-medium text-gray-800">
                      {quotation.quotationItems.length}{" "}
                      {quotation.quotationItems.length === 1
                        ? "producto"
                        : "productos"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 max-w-xs">
                      {quotation.quotationItems.slice(0, 2).map((item, idx) => (
                        <span key={item.id}>
                          {item.product?.name || "Sin nombre"}
                          {idx <
                            Math.min(2, quotation.quotationItems.length) - 1 &&
                            ", "}
                        </span>
                      ))}
                      {quotation.quotationItems.length > 2 && (
                        <span className="font-medium">
                          {" "}
                          +{quotation.quotationItems.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-green-600">
                      {formatCurrency(quotation.totalAmount)}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {getStatusBadge(quotation.status)}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/sales/quotation/${quotation.id}`}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow hover:shadow-md transition-all duration-200 whitespace-nowrap"
                      >
                        Ver
                      </Link>
                      {quotation.status === "pending" && (
                        <button
                          onClick={() => handleConvertToSale(quotation)}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow hover:shadow-md transition-all duration-200 whitespace-nowrap"
                        >
                          Vender
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(quotation.id!)}
                        className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow hover:shadow-md transition-all duration-200 whitespace-nowrap"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {quotations.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500 bg-gray-50">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p>No se encontraron cotizaciones</p>
            <p className="text-sm mt-1">
              {searchTerm
                ? "Prueba con otros términos de búsqueda."
                : "Crea una nueva cotización para comenzar."}
            </p>
          </div>
        )}
      </div>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4">
          <p className="text-sm text-gray-600">
            Mostrando página {pagination.page} de {pagination.totalPages} (
            {pagination.totalCount} cotizaciones)
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>

            <span className="px-4 py-2 text-sm font-medium text-gray-800 bg-gray-100 rounded-lg">
              {pagination.page}
            </span>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
