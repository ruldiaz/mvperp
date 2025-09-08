// src/app/dashboard/customers/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Customer } from "@/types/customer";
import { Sale } from "@/types/sale";

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

  useEffect(() => {
    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  const fetchCustomer = async () => {
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
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar este cliente?")) {
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

      router.push("/dashboard/customers");
      router.refresh();
    } catch (err) {
      console.error("Error deleting customer:", err);
      alert(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const handleEdit = (updatedCustomer: CustomerDetails) => {
    setCustomer(updatedCustomer);
    setShowEditModal(false);
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
          href="/dashboard/customers"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Volver a clientes
        </Link>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          No se pudo cargar la información del cliente
        </div>
        <Link
          href="/dashboard/customers"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Volver a clientes
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <Link
            href="/dashboard/customers"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Volver a clientes
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">{customer.name}</h1>
          {customer.email && (
            <p className="text-gray-600">Email: {customer.email}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Información del cliente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Información de Contacto
          </h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">Teléfono:</span>
              <p className="text-gray-600">
                {customer.phone || "No especificado"}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Email:</span>
              <p className="text-gray-600">
                {customer.email || "No especificado"}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">RFC:</span>
              <p className="text-gray-600">
                {customer.rfc || "No especificado"}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Razón Social:</span>
              <p className="text-gray-600">
                {customer.razonSocial || "No especificado"}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Uso CFDI:</span>
              <p className="text-gray-600">
                {customer.usoCFDI || "No especificado"}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Régimen Fiscal:</span>
              <p className="text-gray-600">
                {customer.taxRegime || "No especificado"}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Dirección:</span>
              <p className="text-gray-600">
                {customer.address || "No especificado"}
              </p>
            </div>
            {customer.fiscalAddress && (
              <div>
                <span className="font-medium text-gray-700">
                  Domicilio Fiscal:
                </span>
                <p className="text-gray-600">{customer.fiscalAddress}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Información de Ventas
          </h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">
                Total de ventas:
              </span>
              <p className="text-green-600 font-semibold">
                {customer.sales.length}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Cliente desde:</span>
              <p className="text-gray-600">
                {customer.createdAt
                  ? formatDate(customer.createdAt)
                  : "Fecha no disponible"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de ventas */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Historial de Ventas ({customer.sales.length})
          </h2>
        </div>

        {customer.sales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customer.sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(sale.date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {sale.saleItems.length} producto(s)
                      </div>
                      <div className="text-sm text-gray-500">
                        {sale.saleItems.slice(0, 2).map((item, index) => (
                          <span key={item.id}>
                            {item.product?.name}
                            {index < sale.saleItems.slice(0, 2).length - 1 &&
                              ", "}
                          </span>
                        ))}
                        {sale.saleItems.length > 2 && "..."}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-green-600">
                        {formatCurrency(sale.totalAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          sale.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : sale.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {sale.status === "completed"
                          ? "Completada"
                          : sale.status === "cancelled"
                            ? "Cancelada"
                            : "Reembolsada"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            No se han realizado ventas para este cliente
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

// Componente Modal de edición COMPLETO
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
      setError(
        err instanceof Error ? err.message : "Error al actualizar el cliente"
      );
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
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Editar Cliente</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Información Básica */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Cliente *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Razón Social (Nombre Fiscal) *
              </label>
              <input
                type="text"
                name="razonSocial"
                value={form.razonSocial}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RFC *
              </label>
              <input
                type="text"
                name="rfc"
                value={form.rfc}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Uso de CFDI *
              </label>
              <select
                name="usoCFDI"
                value={form.usoCFDI}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Régimen Fiscal *
              </label>
              <select
                name="taxRegime"
                value={form.taxRegime}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección de Contacto
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Información Fiscal Detallada */}
            <div className="md:col-span-2">
              <div className="border-t pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowFiscalInfo(!showFiscalInfo)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {showFiscalInfo ? (
                    <span>▲ Ocultar información fiscal detallada</span>
                  ) : (
                    <span>▼ Mostrar información fiscal detallada</span>
                  )}
                </button>
              </div>
            </div>

            {showFiscalInfo && (
              <>
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Domicilio Fiscal
                  </h3>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Domicilio Fiscal Completo
                  </label>
                  <textarea
                    name="fiscalAddress"
                    value={form.fiscalAddress}
                    onChange={handleChange}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calle
                  </label>
                  <input
                    type="text"
                    name="fiscalStreet"
                    value={form.fiscalStreet}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número Exterior
                  </label>
                  <input
                    type="text"
                    name="fiscalExteriorNumber"
                    value={form.fiscalExteriorNumber}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número Interior
                  </label>
                  <input
                    type="text"
                    name="fiscalInteriorNumber"
                    value={form.fiscalInteriorNumber}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Colonia
                  </label>
                  <input
                    type="text"
                    name="fiscalNeighborhood"
                    value={form.fiscalNeighborhood}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    name="fiscalPostalCode"
                    value={form.fiscalPostalCode}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    name="fiscalCity"
                    value={form.fiscalCity}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <input
                    type="text"
                    name="fiscalState"
                    value={form.fiscalState}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Municipio/Alcaldía
                  </label>
                  <input
                    type="text"
                    name="fiscalMunicipality"
                    value={form.fiscalMunicipality}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    name="fiscalCountry"
                    value={form.fiscalCountry}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? "Actualizando..." : "Actualizar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
