// src/app/dashboard/customers/[id]/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Customer } from "@/types/customer";
import { Sale } from "@/types/sale";
import { toast } from "react-hot-toast";

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

  // ✅ useCallback para evitar warning de dependencias
  const fetchCustomer = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/customers/${customerId}`, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Cliente no encontrado");
        }
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
    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

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
      setTimeout(() => {
        router.push("/dashboard/customers");
      }, 1500);
    } catch (err) {
      console.error("Error deleting customer:", err);
      toast.error(
        err instanceof Error ? err.message : "Error al eliminar cliente"
      );
    }
  };

  const handleEdit = (updatedCustomer: CustomerDetails) => {
    setCustomer(updatedCustomer);
    setShowEditModal(false);
    toast.success("Cliente actualizado exitosamente");
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
    const config = {
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
    };
    const selected = config[status as keyof typeof config] || {
      color: "from-gray-100 to-gray-200 text-gray-800",
      label: status.toUpperCase(),
      icon: "📄",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${selected.color} flex items-center gap-1`}
      >
        <span>{selected.icon}</span>
        {selected.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Cargando datos del cliente...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
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
          href="/dashboard/customers"
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
          Volver a clientes
        </Link>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 text-yellow-700 px-6 py-4 rounded-2xl">
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
            <span>No se pudo cargar la información del cliente</span>
          </div>
        </div>
        <Link
          href="/dashboard/customers"
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
          Volver a clientes
        </Link>
      </div>
    );
  }

  const totalSales = customer.sales.reduce(
    (sum, sale) => sum + sale.totalAmount,
    0
  );
  const totalProducts = customer.sales.reduce(
    (sum, sale) => sum + sale.saleItems.length,
    0
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <Link
            href="/dashboard/customers"
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
            Volver a clientes
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">{customer.name}</h1>
          <p className="text-gray-600 mt-2">
            {customer.email || "Sin correo registrado"} • Registrado el{" "}
            {customer.createdAt
              ? new Date(customer.createdAt).toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowEditModal(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2"
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
            Editar Cliente
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
            Eliminar Cliente
          </button>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                Total de Ventas
              </p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {customer.sales.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">📊</span>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 font-medium">Valor Total</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {formatCurrency(totalSales)}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">💰</span>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                Productos Comprados
              </p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {totalProducts}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">📦</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información del cliente */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
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
            Información de Contacto
          </h2>
          <div className="space-y-5">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {customer.name?.[0]?.toUpperCase() || "C"}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">
                    {customer.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {customer.email || "Sin correo"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {customer.rfc && (
                  <div className="text-sm">
                    <span className="text-gray-600 font-medium">RFC:</span>
                    <span className="ml-2">{customer.rfc}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="text-sm">
                    <span className="text-gray-600 font-medium">Teléfono:</span>
                    <span className="ml-2">{customer.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: "Razón Social", value: customer.razonSocial },
                { label: "Uso CFDI", value: customer.usoCFDI },
                { label: "Régimen Fiscal", value: customer.taxRegime },
                { label: "Dirección", value: customer.address },
                { label: "Domicilio Fiscal", value: customer.fiscalAddress },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-600 font-medium">{label}:</span>
                  <span className="text-gray-800 font-medium">
                    {value || "—"}{" "}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            Información Comercial
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl">
              <span className="text-gray-700 font-medium">Cliente desde</span>
              <span className="font-semibold text-gray-800">
                {customer.createdAt
                  ? new Date(customer.createdAt).toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl">
              <span className="text-gray-700 font-medium">Total de ventas</span>
              <span className="font-semibold text-gray-800">
                {customer.sales.length}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl">
              <span className="text-gray-700 font-medium">Monto total</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(totalSales)}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl">
              <span className="text-gray-700 font-medium">Última compra</span>
              <span className="font-semibold text-gray-800">
                {customer.sales.length > 0
                  ? formatDate(
                      new Date(
                        Math.max(
                          ...customer.sales.map((s) =>
                            new Date(s.date).getTime()
                          )
                        )
                      )
                    )
                  : "Nunca"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de ventas */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
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
          Historial de Ventas ({customer.sales.length})
        </h2>

        {customer.sales.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Fecha
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customer.sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">
                        {formatDate(sale.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">
                        {sale.saleItems.length} producto(s)
                      </div>
                      <div className="text-sm text-gray-500 mt-1 max-w-xs truncate">
                        {sale.saleItems.slice(0, 2).map((item, idx) => (
                          <span key={item.id}>
                            {item.product?.name || "Producto"}
                            {idx < Math.min(2, sale.saleItems.length) - 1 &&
                              ", "}
                          </span>
                        ))}
                        {sale.saleItems.length > 2 && (
                          <span className="font-medium">
                            {" "}
                            +{sale.saleItems.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-green-600">
                        {formatCurrency(sale.totalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(sale.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p>No se han registrado ventas para este cliente</p>
          </div>
        )}
      </div>

      {/* Modal de edición */}
      {showEditModal && (
        <EditCustomerModal
          customer={customer}
          onClose={() => setShowEditModal(false)}
          onCustomerUpdated={handleEdit}
        />
      )}
    </div>
  );
}

// Modal de edición con estilo coherente
function EditCustomerModal({
  customer,
  onClose,
  onCustomerUpdated,
}: {
  customer: CustomerDetails;
  onClose: () => void;
  onCustomerUpdated: (customer: CustomerDetails) => void;
}) {
  const [form, setForm] = useState({
    name: customer.name,
    razonSocial: customer.razonSocial || "",
    email: customer.email || "",
    phone: customer.phone || "",
    address: customer.address || "",
    rfc: customer.rfc || "",
    usoCFDI: customer.usoCFDI || "",
    taxRegime: customer.taxRegime || "",
    fiscalAddress: customer.fiscalAddress || "",
    fiscalStreet: customer.fiscalStreet || "",
    fiscalExteriorNumber: customer.fiscalExteriorNumber || "",
    fiscalInteriorNumber: customer.fiscalInteriorNumber || "",
    fiscalNeighborhood: customer.fiscalNeighborhood || "",
    fiscalPostalCode: customer.fiscalPostalCode || "",
    fiscalCity: customer.fiscalCity || "",
    fiscalState: customer.fiscalState || "",
    fiscalMunicipality: customer.fiscalMunicipality || "",
    fiscalCountry: customer.fiscalCountry || "México",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFiscalInfo, setShowFiscalInfo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.razonSocial.trim() || !form.rfc.trim()) {
      toast.error("Los campos Nombre, Razón Social y RFC son obligatorios");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al actualizar cliente");
      }

      const data = await res.json();
      onCustomerUpdated({ ...customer, ...data.customer });
    } catch (err) {
      console.error("Error updating customer:", err);
      const message =
        err instanceof Error ? err.message : "Error al actualizar el cliente";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Editar Cliente</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Cliente *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nombre completo"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razón Social (Nombre Fiscal) *
              </label>
              <input
                type="text"
                name="razonSocial"
                value={form.razonSocial}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nombre para facturación"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="cliente@ejemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+52 123 456 7890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RFC *
              </label>
              <input
                type="text"
                name="rfc"
                value={form.rfc}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="XAXX010101000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uso de CFDI *
              </label>
              <select
                name="usoCFDI"
                value={form.usoCFDI}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar uso de CFDI</option>
                <option value="G01">Adquisición de mercancías</option>
                <option value="G02">
                  Devoluciones, descuentos o bonificaciones
                </option>
                <option value="G03">Gastos en general</option>
                <option value="I01">Construcciones</option>
                <option value="I02">Mobiliario y equipo de oficina</option>
                <option value="I03">Equipo de transporte</option>
                <option value="I04">Equipo de cómputo y accesorios</option>
                <option value="I05">
                  Dados, troqueles, moldes, matrices y herramental
                </option>
                <option value="I06">Comunicaciones telefónicas</option>
                <option value="I07">Comunicaciones satelitales</option>
                <option value="I08">Otra maquinaria y equipo</option>
                <option value="D01">
                  Honorarios médicos, dentales y gastos hospitalarios
                </option>
                <option value="D02">
                  Gastos médicos por incapacidad o discapacidad
                </option>
                <option value="D03">Gastos funerales</option>
                <option value="D04">Donativos</option>
                <option value="D05">
                  Intereses reales efectivamente pagados por créditos
                  hipotecarios
                </option>
                <option value="D06">Aportaciones voluntarias al SAR</option>
                <option value="D07">
                  Primas por seguros de gastos médicos
                </option>
                <option value="D08">Gastos de transportación escolar</option>
                <option value="D09">Depósitos en cuentas para el ahorro</option>
                <option value="D10">Pagos por servicios educativos</option>
                <option value="S01">Sin efectos fiscales</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Régimen Fiscal *
              </label>
              <select
                name="taxRegime"
                value={form.taxRegime}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar régimen fiscal</option>
                <option value="601">General de Ley Personas Morales</option>
                <option value="603">
                  Personas Morales con Fines no Lucrativos
                </option>
                <option value="605">
                  Sueldos y Salarios e Ingresos Asimilados a Salarios
                </option>
                <option value="606">Arrendamiento</option>
                <option value="607">
                  Régimen de Enajenación o Adquisición de Bienes
                </option>
                <option value="608">Demás ingresos</option>
                <option value="609">Consolidación</option>
                <option value="610">
                  Residentes en el Extranjero sin Establecimiento Permanente en
                  México
                </option>
                <option value="611">
                  Ingresos por Dividendos (socios y accionistas)
                </option>
                <option value="612">
                  Personas Físicas con Actividades Empresariales y Profesionales
                </option>
                <option value="614">Ingresos por intereses</option>
                <option value="615">
                  Régimen de los ingresos por obtención de premios
                </option>
                <option value="616">Sin obligaciones fiscales</option>
                <option value="620">
                  Sociedades Cooperativas de Producción que optan por diferir
                  sus ingresos
                </option>
                <option value="621">Incorporación Fiscal</option>
                <option value="622">
                  Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras
                </option>
                <option value="623">Opcional para Grupos de Sociedades</option>
                <option value="624">Coordinados</option>
                <option value="625">
                  Régimen de las Actividades Empresariales con ingresos a través
                  de Plataformas Tecnológicas
                </option>
                <option value="626">Régimen Simplificado de Confianza</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección de Contacto
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={2}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Calle, número, colonia, ciudad..."
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => setShowFiscalInfo(!showFiscalInfo)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              {showFiscalInfo ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                  Ocultar información fiscal detallada
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  Mostrar información fiscal detallada
                </>
              )}
            </button>
          </div>

          {showFiscalInfo && (
            <div className="space-y-6 mt-4">
              <h3 className="text-xl font-bold text-gray-800">
                Domicilio Fiscal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domicilio Fiscal Completo
                  </label>
                  <textarea
                    name="fiscalAddress"
                    value={form.fiscalAddress}
                    onChange={handleChange}
                    rows={2}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Domicilio fiscal completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Calle
                  </label>
                  <input
                    type="text"
                    name="fiscalStreet"
                    value={form.fiscalStreet}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nombre de la calle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número Exterior
                  </label>
                  <input
                    type="text"
                    name="fiscalExteriorNumber"
                    value={form.fiscalExteriorNumber}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número Interior
                  </label>
                  <input
                    type="text"
                    name="fiscalInteriorNumber"
                    value={form.fiscalInteriorNumber}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Colonia
                  </label>
                  <input
                    type="text"
                    name="fiscalNeighborhood"
                    value={form.fiscalNeighborhood}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nombre de la colonia"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    name="fiscalPostalCode"
                    value={form.fiscalPostalCode}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="01000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    name="fiscalCity"
                    value={form.fiscalCity}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ciudad de México"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <input
                    type="text"
                    name="fiscalState"
                    value={form.fiscalState}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ciudad de México"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Municipio/Alcaldía
                  </label>
                  <input
                    type="text"
                    name="fiscalMunicipality"
                    value={form.fiscalMunicipality}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Benito Juárez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    País
                  </label>
                  <input
                    type="text"
                    name="fiscalCountry"
                    value={form.fiscalCountry}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="México"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-xl font-medium hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
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
                  Actualizando...
                </>
              ) : (
                "Actualizar Cliente"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
