// src/app/dashboard/customers/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function CreateCustomer() {
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
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.razonSocial.trim() || !form.rfc.trim()) {
      toast.error("Los campos Nombre, Razón Social y RFC son obligatorios");
      return;
    }

    if (!form.usoCFDI || !form.taxRegime) {
      toast.error("Los campos Uso de CFDI y Régimen Fiscal son obligatorios");
      return;
    }

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
      toast.success("Cliente creado exitosamente");
      router.push(`/dashboard/customers/${data.customer.id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Error al crear el cliente";
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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="pt-8 pb-8 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-b-2xl shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2 leading-tight">
                Nuevo Cliente
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl">
                Agrega un nuevo cliente a tu sistema
              </p>
            </div>
            <Link
              href="/dashboard/customers"
              className="mt-4 md:mt-0 bg-transparent border-2 border-white text-white px-6 py-2 rounded-lg font-semibold hover:bg-white/10 transition-all duration-200"
            >
              ← Volver
            </Link>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="text-2xl bg-white p-3 rounded-xl shadow-sm">
                  ⚠️
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-800 mb-1">
                    Error
                  </h3>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Información Básica */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-gray-200 shadow-sm">
            <div className="flex items-start space-x-6 mb-6">
              <div className="text-4xl bg-white p-4 rounded-xl shadow-sm">
                👤
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  Información Básica
                </h2>
                <p className="text-gray-600 mb-6">
                  Datos principales del cliente
                </p>
              </div>
            </div>

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
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                  placeholder="Ej: Juan Pérez"
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
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                  placeholder="Razón social para facturación"
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
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
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
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                  placeholder="+52 123 456 7890"
                />
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
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                  placeholder="Calle, número, colonia, ciudad..."
                />
              </div>
            </div>
          </div>

          {/* Información Fiscal Obligatoria */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-gray-200 shadow-sm">
            <div className="flex items-start space-x-6 mb-6">
              <div className="text-4xl bg-white p-4 rounded-xl shadow-sm">
                🧾
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  Información Fiscal Obligatoria
                </h2>
                <p className="text-gray-600 mb-6">
                  Datos requeridos para facturación
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
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
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
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
                  <option value="D09">
                    Depósitos en cuentas para el ahorro
                  </option>
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
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
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
                    Residentes en el Extranjero sin Establecimiento Permanente
                    en México
                  </option>
                  <option value="611">
                    Ingresos por Dividendos (socios y accionistas)
                  </option>
                  <option value="612">
                    Personas Físicas con Actividades Empresariales y
                    Profesionales
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
                  <option value="623">
                    Opcional para Grupos de Sociedades
                  </option>
                  <option value="624">Coordinados</option>
                  <option value="625">
                    Régimen de las Actividades Empresariales con ingresos a
                    través de Plataformas Tecnológicas
                  </option>
                  <option value="626">Régimen Simplificado de Confianza</option>
                </select>
              </div>
            </div>
          </div>

          {/* Información Fiscal Detallada */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-gray-200 shadow-sm">
            <div className="flex items-start space-x-6 mb-6">
              <div className="text-4xl bg-white p-4 rounded-xl shadow-sm">
                📍
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    Domicilio Fiscal
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowFiscalInfo(!showFiscalInfo)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
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
                        Ocultar detalles
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
                        Mostrar detalles
                      </>
                    )}
                  </button>
                </div>
                <p className="text-gray-600 mb-6">
                  Información detallada del domicilio fiscal (opcional)
                </p>
              </div>
            </div>

            {!showFiscalInfo ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  La información fiscal detallada es opcional
                </p>
                <button
                  type="button"
                  onClick={() => setShowFiscalInfo(true)}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 px-6 py-3 rounded-lg font-medium hover:from-blue-100 hover:to-indigo-100 transition-all duration-200"
                >
                  Mostrar campos de domicilio fiscal
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calle
                    </label>
                    <input
                      type="text"
                      name="fiscalStreet"
                      value={form.fiscalStreet}
                      onChange={handleChange}
                      className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
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
                      className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
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
                      className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
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
                      className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
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
                      className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
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
                      className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
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
                      className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
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
                      className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
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
                      className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                      placeholder="México"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Domicilio Fiscal Completo
                    </label>
                    <textarea
                      name="fiscalAddress"
                      value={form.fiscalAddress}
                      onChange={handleChange}
                      rows={2}
                      className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                      placeholder="Domicilio fiscal completo"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-4">
            <Link
              href="/dashboard/customers"
              className="bg-transparent border-2 border-gray-300 text-gray-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
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
                  Creando...
                </>
              ) : (
                "Crear Cliente"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
