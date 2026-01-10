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
    csdCert: undefined,
    csdKey: undefined,
    csdPassword: undefined,
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
          setFormData({
            ...data.company,
            interiorNumber: data.company.interiorNumber || "",
            country: data.company.country || "México",
            email: data.company.email || "",
            phone: data.company.phone || "",
            pac: data.company.pac || "",
            pacUser: data.company.pacUser || "",
            pacPass: data.company.pacPass || "",
            csdCert: data.company.csdCert || undefined,
            csdKey: data.company.csdKey || undefined,
            csdPassword: data.company.csdPassword || undefined,
          });
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
      // 1. Separar datos fiscales y CSD
      const { csdCert, csdKey, csdPassword, ...companyData } = formData;

      // 2. Guardar datos fiscales (sin CSD)
      const companyRes = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyData),
        credentials: "include",
      });

      if (!companyRes.ok) {
        const errData = await companyRes.json();
        throw new Error(errData.error || "Error al guardar datos fiscales");
      }

      const companyResult = await companyRes.json();
      setCompany(companyResult.company);

      // 3. Si se subió CSD, validarlo por separado
      if (csdCert && csdKey && csdPassword) {
        const csdRes = await fetch("/api/company/certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csdCert, csdKey, csdPassword }),
          credentials: "include",
        });

        if (!csdRes.ok) {
          const csdData = await csdRes.json();
          throw new Error(csdData.error || "El certificado no es válido");
        }
      }

      setMessage("Datos guardados correctamente");
      setIsEditing(false);
    } catch (error) {
      console.error("Error al guardar:", error);
      setMessage(error instanceof Error ? error.message : "Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Special handling for testMode toggle
    if (name === "testMode" && type === "checkbox") {
      const newTestMode = (e.target as HTMLInputElement).checked;
      
      // If switching to production mode (testMode = false), show warning
      if (!newTestMode && formData.testMode) {
        const confirmed = window.confirm(
          '⚠️ ADVERTENCIA: Activación de Modo PRODUCCIÓN\n\n' +
          '• Las facturas se timbrarán con el SAT de forma REAL\n' +
          '• Se consumirán timbres reales (costo por factura)\n' +
          '• Las facturas serán legalmente válidas\n' +
          '• La cancelación requiere aprobación del receptor\n' +
          '• Asegúrese de tener certificados CSD válidos\n\n' +
          '¿Está seguro de que desea activar el modo PRODUCCIÓN?'
        );
        
        if (!confirmed) {
          return; // Don't change the value
        }
      }
    }
    
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
        interiorNumber: company.interiorNumber || "",
        country: company.country || "México",
        email: company.email || "",
        phone: company.phone || "",
        pac: company.pac || "",
        pacUser: company.pacUser || "",
        pacPass: company.pacPass || "",
        csdCert: company.csdCert || undefined,
        csdKey: company.csdKey || undefined,
        csdPassword: company.csdPassword || undefined,
      });
    }
    setIsEditing(false);
    setMessage("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex justify-center items-center">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl border border-gray-200 shadow-sm text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">
            Cargando datos de la empresa...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="pt-8 pb-8 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-b-2xl shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2 leading-tight">
                Perfil de Empresa
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl">
                Configura tus datos fiscales y de facturación
              </p>
            </div>
            <Link
              href="/dashboard"
              className="mt-4 md:mt-0 bg-transparent border-2 border-white text-white px-6 py-2 rounded-lg font-semibold hover:bg-white/10 transition-all duration-200"
            >
              ← Volver al Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Mensaje informativo cuando está validando */}
        {saving && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
            <div className="flex items-center space-x-4">
              <div className="text-2xl bg-white p-3 rounded-xl shadow-sm animate-pulse">
                🔐
              </div>
              <div className="flex-1">
                <p className="font-medium text-blue-800">
                  Validando certificado...
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  Verificando RFC, vigencia y correspondencia entre certificado
                  y llave privada
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje de resultado (éxito o error) */}
        {message && !saving && (
          <div
            className={`mb-8 p-6 rounded-2xl border shadow-sm ${
              message.includes("Error") || message.includes("fallida")
                ? "bg-gradient-to-r from-red-50 to-pink-50 border-red-200 text-red-800"
                : "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800"
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className="text-2xl bg-white p-3 rounded-xl shadow-sm">
                {message.includes("Error") || message.includes("fallida")
                  ? "⚠️"
                  : "✅"}
              </div>
              <div className="flex-1">
                <p className="font-medium">{message}</p>
                {message.includes("contraseña") && (
                  <p className="text-sm mt-2 opacity-80">
                    💡 Asegúrate de usar la contraseña correcta del CSD (la que
                    utilizaste al generar los archivos)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mostrar estado del CSD en modo lectura */}
        {!isEditing && company?.csdCert && (
          <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
            <div className="flex items-center gap-2 text-green-800 font-medium">
              ✅ Certificado de Sello Digital cargado y validado
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información Básica */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-gray-200 shadow-sm">
            <div className="flex items-start space-x-6 mb-6">
              <div className="text-4xl bg-white p-4 rounded-xl shadow-sm">
                🏢
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    Información Básica
                  </h2>
                  {!isEditing && company && (
                    <button
                      type="button"
                      onClick={handleEdit}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      ✏️ Editar
                    </button>
                  )}
                </div>
                <p className="text-gray-600 mb-6">
                  Datos fiscales principales de tu empresa
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razón Social *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={!isEditing}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Nombre legal de la empresa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RFC *
                </label>
                <input
                  type="text"
                  name="rfc"
                  value={formData.rfc}
                  onChange={handleInputChange}
                  required
                  disabled={!isEditing}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed uppercase"
                  placeholder="XAXX010101000"
                  maxLength={13}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Régimen Fiscal *
                </label>
                <select
                  name="regime"
                  value={formData.regime}
                  onChange={handleInputChange}
                  required
                  disabled={!isEditing}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
          <div className="p-8 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-gray-200 shadow-sm">
            <div className="flex items-start space-x-6 mb-6">
              <div className="text-4xl bg-white p-4 rounded-xl shadow-sm">
                📍
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  Domicilio Fiscal
                </h2>
                <p className="text-gray-600 mb-6">
                  Dirección legal para facturación
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calle *
                </label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  required
                  disabled={!isEditing}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Nombre de la calle"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número Exterior *
                </label>
                <input
                  type="text"
                  name="exteriorNumber"
                  value={formData.exteriorNumber}
                  onChange={handleInputChange}
                  required
                  disabled={!isEditing}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número Interior
                </label>
                <input
                  type="text"
                  name="interiorNumber"
                  value={formData.interiorNumber || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Colonia *
                </label>
                <input
                  type="text"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleInputChange}
                  required
                  disabled={!isEditing}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Nombre de la colonia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código Postal *
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  required
                  disabled={!isEditing}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="00000"
                  maxLength={5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  disabled={!isEditing}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Ciudad"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  disabled={!isEditing}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Estado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Municipio *
                </label>
                <input
                  type="text"
                  name="municipality"
                  value={formData.municipality}
                  onChange={handleInputChange}
                  required
                  disabled={!isEditing}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Municipio"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  País *
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                  disabled={!isEditing}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="México"
                />
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-gray-200 shadow-sm">
            <div className="flex items-start space-x-6 mb-6">
              <div className="text-4xl bg-white p-4 rounded-xl shadow-sm">
                📞
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  Contacto
                </h2>
                <p className="text-gray-600 mb-6">
                  Información de contacto de la empresa
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="empresa@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="+52 123 456 7890"
                />
              </div>
            </div>
          </div>

          {/* Configuración PAC */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-gray-200 shadow-sm">
            <div className="flex items-start space-x-6 mb-6">
              <div className="text-4xl bg-white p-4 rounded-xl shadow-sm">
                ⚙️
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  Configuración PAC
                </h2>
                <p className="text-gray-600 mb-6">
                  Configuración para timbrado de facturas
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PAC
                </label>
                <select
                  name="pac"
                  value={formData.pac || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario PAC
                </label>
                <input
                  type="text"
                  name="pacUser"
                  value={formData.pacUser || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="usuario_pac"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña PAC
                </label>
                <input
                  type="password"
                  name="pacPass"
                  value={formData.pacPass || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 bg-white">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="testMode"
                    checked={formData.testMode}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                  />
                  <label className="ml-3 text-gray-700 font-medium">
                    Modo Pruebas (Sandbox)
                  </label>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  formData.testMode 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {formData.testMode ? '🧪 SANDBOX' : '✅ PRODUCCIÓN'}
                </span>
              </div>
              
              {/* Info box explaining the modes */}
              <div className={`p-4 rounded-lg border ${
                formData.testMode 
                  ? 'bg-yellow-50 border-yellow-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className="text-sm text-gray-700">
                  {formData.testMode ? (
                    <>
                      <strong>Modo Sandbox:</strong> Las facturas se timbran en el ambiente de pruebas de Facturama. 
                      No son válidas fiscalmente y no consumen timbres reales. Ideal para desarrollo y pruebas.
                    </>
                  ) : (
                    <>
                      <strong className="text-red-600">Modo Producción:</strong> Las facturas se timbran con el SAT de forma real. 
                      Son legalmente válidas, consumen timbres reales y requieren certificados CSD válidos.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* 🔐 Certificado de Sello Digital (CSD) – Solo en edición */}
          {isEditing && (
            <div className="p-8 rounded-2xl bg-gradient-to-r from-red-50 to-pink-50 border border-gray-200 shadow-sm">
              <div className="flex items-start space-x-6 mb-6">
                <div className="text-4xl bg-white p-4 rounded-xl shadow-sm">
                  🔐
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    Certificado de Sello Digital (CSD)
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Sube tu certificado (.cer), llave privada (.key) y su
                    contraseña
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificado (.cer)
                  </label>
                  <input
                    type="file"
                    accept=".cer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          const binary = reader.result as string;
                          const base64 = btoa(binary);
                          setFormData((prev) => ({ ...prev, csdCert: base64 }));
                        };
                        reader.readAsBinaryString(file);
                      }
                    }}
                    className="w-full p-3 rounded-xl border border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Llave privada (.key)
                  </label>
                  <input
                    type="file"
                    accept=".cer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          // ✅ Tipado seguro: verificamos que el resultado sea string
                          if (typeof reader.result === "string") {
                            const base64 = btoa(reader.result);
                            setFormData((prev) => ({
                              ...prev,
                              csdCert: base64,
                            }));
                          }
                          // Si no es string, ignoramos (no debería pasar con readAsBinaryString)
                        };
                        reader.readAsBinaryString(file);
                      }
                    }}
                    className="w-full p-3 rounded-xl border border-gray-300"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña del CSD
                  </label>
                  <input
                    type="password"
                    value={formData.csdPassword || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        csdPassword: e.target.value,
                      }))
                    }
                    className="w-full p-3 rounded-xl border border-gray-300"
                    placeholder="Contraseña del certificado"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-4">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-transparent border-2 border-gray-300 text-gray-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {saving ? (
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
                      Guardando...
                    </>
                  ) : (
                    "Guardar Datos"
                  )}
                </button>
              </>
            ) : (
              !company && (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  + Crear Datos Fiscales
                </button>
              )
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
