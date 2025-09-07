// app/dashboard/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Company,
  CompanyFormData,
  REGIMENES_FISCALES,
  PAC_OPTIONS,
} from "@/types/company";

export default function CompanyProfile() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<CompanyFormData>({
    name: "",
    rfc: "",
    regime: "",
    street: "",
    exteriorNumber: "",
    interiorNumber: "",
    neighborhood: "",
    postalCode: "",
    city: "",
    state: "",
    municipality: "",
    country: "México",
    email: "",
    phone: "",
    pac: "",
    pacUser: "",
    pacPass: "",
    testMode: true,
  });

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      const response = await fetch("/api/company", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.company) {
          setCompany(data.company);
          setFormData(data.company);
        }
      } else if (response.status === 404) {
        setCompany(null);
      }
    } catch (error) {
      console.error("Error al cargar datos de la compañía:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setCompany(data.company);
        setMessage("Datos guardados correctamente");
        setIsEditing(false); // Salir del modo edición después de guardar
      } else {
        setMessage(data.error || "Error al guardar los datos");
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      setMessage("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (company) {
      setFormData({
        ...company,
        interiorNumber: company.interiorNumber || undefined, // Convertir null a undefined
        country: company.country || undefined,
        email: company.email || undefined,
        phone: company.phone || undefined,
        pac: company.pac || undefined,
        pacUser: company.pacUser || undefined,
        pacPass: company.pacPass || undefined,
      });
    }
    setIsEditing(false);
    setMessage("");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Encabezado con botones */}
      <div className="flex justify-between items-center mb-6">
        <Link
          href="/dashboard"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Volver al Dashboard
        </Link>

        {!isEditing && company && (
          <button
            onClick={handleEdit}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Editar
          </button>
        )}
      </div>

      <h1 className="text-2xl font-bold mb-6">Datos Fiscales de la Empresa</h1>

      {message && (
        <div
          className={`p-4 mb-4 rounded ${
            message.includes("Error")
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Información Básica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Razón Social *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={!isEditing}
                className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">RFC *</label>
              <input
                type="text"
                name="rfc"
                value={formData.rfc}
                onChange={handleInputChange}
                required
                disabled={!isEditing}
                className="w-full p-2 border rounded uppercase disabled:bg-gray-100 disabled:cursor-not-allowed"
                maxLength={13}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Régimen Fiscal *
              </label>
              <select
                name="regime"
                value={formData.regime}
                onChange={handleInputChange}
                required
                disabled={!isEditing}
                className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Seleccionar régimen</option>
                {REGIMENES_FISCALES.map((regimen) => (
                  <option key={regimen.value} value={regimen.value}>
                    {regimen.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Domicilio Fiscal */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Domicilio Fiscal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Calle *</label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                required
                disabled={!isEditing}
                className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Número Exterior *
              </label>
              <input
                type="text"
                name="exteriorNumber"
                value={formData.exteriorNumber}
                onChange={handleInputChange}
                required
                disabled={!isEditing}
                className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Número Interior
              </label>
              <input
                type="text"
                name="interiorNumber"
                value={formData.interiorNumber || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Colonia *
              </label>
              <input
                type="text"
                name="neighborhood"
                value={formData.neighborhood}
                onChange={handleInputChange}
                required
                disabled={!isEditing}
                className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Código Postal *
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                required
                disabled={!isEditing}
                className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                maxLength={5}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ciudad *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
                disabled={!isEditing}
                className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado *</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                required
                disabled={!isEditing}
                className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Municipio *
              </label>
              <input
                type="text"
                name="municipality"
                value={formData.municipality}
                onChange={handleInputChange}
                required
                disabled={!isEditing}
                className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">País *</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                required
                disabled={!isEditing}
                className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Contacto</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Configuración PAC */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Configuración PAC</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">PAC</label>
              <select
                name="pac"
                value={formData.pac || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Seleccionar PAC</option>
                {PAC_OPTIONS.map((pac) => (
                  <option key={pac.value} value={pac.value}>
                    {pac.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Usuario PAC
              </label>
              <input
                type="text"
                name="pacUser"
                value={formData.pacUser || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Contraseña PAC
              </label>
              <input
                type="password"
                name="pacPass"
                value={formData.pacPass || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="testMode"
                checked={formData.testMode}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mr-2 disabled:cursor-not-allowed"
              />
              <label className="text-sm font-medium">Modo Pruebas</label>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        {isEditing ? (
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
            >
              {saving ? "Guardando..." : "Guardar Datos"}
            </button>
          </div>
        ) : (
          !company && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleEdit}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Crear Datos Fiscales
              </button>
            </div>
          )
        )}
      </form>
    </div>
  );
}
