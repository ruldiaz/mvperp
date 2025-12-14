// src/app/dashboard/suppliers/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateSupplier() {
  const [form, setForm] = useState({
    name: "",
    contactName: "",
    phone: "",
    email: "",
    street: "",
    neighborhood: "",
    postalCode: "",
    city: "",
    state: "",
    municipality: "",
    rfc: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validación de RFC
    if (form.rfc && !/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(form.rfc)) {
      setError("El formato del RFC no es válido");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al crear proveedor");
      }

      const data = await res.json();
      router.push(`/dashboard/suppliers/${data.supplier.id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Error al crear el proveedor"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
                Nuevo Proveedor
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl">
                Agrega un nuevo proveedor a tu sistema
              </p>
            </div>
            <Link
              href="/dashboard/suppliers"
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
                🏢
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  Información Básica
                </h2>
                <p className="text-gray-600 mb-6">
                  Información principal del proveedor
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Proveedor *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                  placeholder="Ingrese el nombre del proveedor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RFC
                </label>
                <input
                  type="text"
                  name="rfc"
                  value={form.rfc}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                  placeholder="XAXX010101000"
                  pattern="[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}"
                  title="Formato de RFC válido: 3-4 letras, 6 dígitos, 3 caracteres alfanuméricos"
                />
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-gray-200 shadow-sm">
            <div className="flex items-start space-x-6 mb-6">
              <div className="text-4xl bg-white p-4 rounded-xl shadow-sm">
                📞
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  Información de Contacto
                </h2>
                <p className="text-gray-600 mb-6">
                  Datos de contacto del proveedor
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de Contacto
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={form.contactName}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                  placeholder="Persona de contacto"
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
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                  placeholder="proveedor@ejemplo.com"
                />
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-gray-200 shadow-sm">
            <div className="flex items-start space-x-6 mb-6">
              <div className="text-4xl bg-white p-4 rounded-xl shadow-sm">
                📍
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  Dirección
                </h2>
                <p className="text-gray-600 mb-6">Ubicación del proveedor</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calle
                </label>
                <input
                  type="text"
                  name="street"
                  value={form.street}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                  placeholder="Nombre de la calle"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Colonia
                </label>
                <input
                  type="text"
                  name="neighborhood"
                  value={form.neighborhood}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                  placeholder="Colonia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código Postal
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={form.postalCode}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                  placeholder="00000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad
                </label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                  placeholder="Ciudad"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <input
                  type="text"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                  placeholder="Estado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Municipio/Localidad
                </label>
                <input
                  type="text"
                  name="municipality"
                  value={form.municipality}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                  placeholder="Municipio"
                />
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-4">
            <Link
              href="/dashboard/suppliers"
              className="bg-transparent border-2 border-gray-300 text-gray-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
                "Crear Proveedor"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
