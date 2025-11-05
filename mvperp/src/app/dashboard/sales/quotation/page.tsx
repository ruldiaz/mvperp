"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Quotation } from "@/types/sale";

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
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar las cotizaciones");
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
    fetchQuotations(newPage, searchTerm);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta cotización?")) {
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
    } catch (err) {
      console.error("Error deleting quotation:", err);
      alert(err instanceof Error ? err.message : "Error al eliminar");
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("es-MX");
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
      <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading && quotations.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Cotizaciones</h1>

        <div className="flex gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar cotizaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <Link
            href="/dashboard/sales/quotation/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>+</span>
            <span className="hidden sm:inline">Nueva Cotización</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quotations.map((quotation) => (
                <tr
                  key={quotation.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      #{quotation.id?.slice(0, 8)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-600">
                      {formatDate(quotation.date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">
                      {quotation.customer?.name || "Cliente no disponible"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-600">
                      {quotation.expiryDate
                        ? formatDate(quotation.expiryDate)
                        : "Sin vencimiento"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {quotation.quotationItems.length} producto(s)
                    </div>
                    <div className="text-sm text-gray-500">
                      {quotation.quotationItems
                        .slice(0, 2)
                        .map((item, index) => (
                          <span key={item.id}>
                            {item.product?.name}
                            {index <
                              quotation.quotationItems.slice(0, 2).length - 1 &&
                              ", "}
                          </span>
                        ))}
                      {quotation.quotationItems.length > 2 && "..."}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-green-600 font-semibold">
                      {formatCurrency(quotation.totalAmount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(quotation.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/sales/quotation/${quotation.id}`}
                        className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors text-sm"
                        title="Ver detalles"
                      >
                        Ver
                      </Link>
                      {quotation.status === "pending" && (
                        <button
                          onClick={() => handleConvertToSale(quotation)}
                          className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors text-sm"
                          title="Convertir a venta"
                        >
                          Vender
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(quotation.id!)}
                        className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors text-sm"
                        title="Eliminar cotización"
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
          <div className="text-center py-8 text-gray-500">
            No se encontraron cotizaciones
          </div>
        )}
      </div>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          <span className="text-sm text-gray-600">
            Página {pagination.page} de {pagination.totalPages}
          </span>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
