// src/app/dashboard/customers/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Customer } from "@/types/customer";

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchCustomers = useCallback(
    async (page = 1, search = "") => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          ...(search && { search }),
        });

        const res = await fetch(`/api/customers?${params}`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Error al cargar los clientes");

        const data = await res.json();
        setCustomers(data.customers);
        setPagination(data.pagination);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los clientes");
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCustomers(1, searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchCustomers]);

  const handlePageChange = (newPage: number) => {
    fetchCustomers(newPage, searchTerm);
  };

  const handleCustomerCreated = (newCustomer: Customer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este cliente?")) {
      return;
    }

    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al eliminar");
      }

      setCustomers((prev) => prev.filter((customer) => customer.id !== id));
    } catch (err) {
      console.error("Error deleting customer:", err);
      alert(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  if (loading && customers.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>

        <div className="flex gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>+</span>
            <span className="hidden sm:inline">Agregar</span>
          </button>
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
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RFC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Razón Social
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Registro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {customer.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-600">{customer.rfc || "-"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-600">
                      {customer.razonSocial || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-600">{customer.email || "-"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-600">{customer.phone || "-"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-600">
                      {customer.createdAt
                        ? new Date(customer.createdAt).toLocaleDateString(
                            "es-MX"
                          )
                        : "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/customers/${customer.id}`}
                        className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors text-sm"
                        title="Ver detalles"
                      >
                        Ver
                      </Link>
                      <button
                        onClick={() => handleDelete(customer.id!)}
                        className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors text-sm"
                        title="Eliminar cliente"
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

        {customers.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No se encontraron clientes
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

      {/* Modal para crear cliente */}
      {showModal && (
        <CustomerModal
          onClose={() => setShowModal(false)}
          onCustomerCreated={handleCustomerCreated}
        />
      )}
    </div>
  );
}

// src/app/dashboard/customers/page.tsx (CustomerModal component)
function CustomerModal({
  onClose,
  onCustomerCreated,
}: {
  onClose: () => void;
  onCustomerCreated: (customer: Customer) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    razonSocial: "",
    email: "",
    phone: "",
    address: "",
    rfc: "",
    usoCFDI: "",
    taxRegime: "",
    fiscalAddress: "",
    fiscalStreet: "",
    fiscalExteriorNumber: "",
    fiscalInteriorNumber: "",
    fiscalNeighborhood: "",
    fiscalPostalCode: "",
    fiscalCity: "",
    fiscalState: "",
    fiscalMunicipality: "",
    fiscalCountry: "México",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFiscalInfo, setShowFiscalInfo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al crear cliente");
      }

      const data = await res.json();
      onCustomerCreated(data.customer);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Error al crear el cliente"
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
          <h2 className="text-xl font-bold text-gray-800">Agregar Cliente</h2>
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
                placeholder="Ingrese el nombre del cliente"
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
                placeholder="Razón social para facturación"
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
                placeholder="cliente@ejemplo.com"
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
                placeholder="+52 123 456 7890"
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
                placeholder="XAXX010101000"
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
                placeholder="Dirección de contacto del cliente"
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
                    placeholder="Domicilio fiscal completo"
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
                    placeholder="Nombre de la calle"
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
                    placeholder="123"
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
                    placeholder="A"
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
                    placeholder="Nombre de la colonia"
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
                    placeholder="01000"
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
                    placeholder="Ciudad de México"
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
                    placeholder="Ciudad de México"
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
                    placeholder="Benito Juárez"
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
                    placeholder="México"
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
              {loading ? "Creando..." : "Crear Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
