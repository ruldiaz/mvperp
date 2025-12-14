// src/app/dashboard/suppliers/[id]/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SupplierDetails as SupplierDetailsType } from "@/types/supplier";

interface EditSupplierModalProps {
  supplier: SupplierDetailsType;
  onClose: () => void;
  onSupplierUpdated: (supplier: SupplierDetailsType) => void;
}

function EditSupplierModal({
  supplier,
  onClose,
  onSupplierUpdated,
}: EditSupplierModalProps) {
  const [form, setForm] = useState({
    name: supplier.name,
    contactName: supplier.contactName || "",
    phone: supplier.phone || "",
    email: supplier.email || "",
    street: supplier.street || "",
    neighborhood: supplier.neighborhood || "",
    postalCode: supplier.postalCode || "",
    city: supplier.city || "",
    state: supplier.state || "",
    municipality: supplier.municipality || "",
    rfc: supplier.rfc || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const res = await fetch(`/api/suppliers/${supplier.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al actualizar proveedor");
      }

      const data = await res.json();
      onSupplierUpdated(data.supplier);
    } catch (err) {
      console.error("Error updating supplier:", err);
      setError(
        err instanceof Error ? err.message : "Error al actualizar el proveedor"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Editar Proveedor</h2>
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Proveedor *
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de Contacto
              </label>
              <input
                type="text"
                name="contactName"
                value={form.contactName}
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

            <div className="md:col-span-2">
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calle
              </label>
              <input
                type="text"
                name="street"
                value={form.street}
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
                name="neighborhood"
                value={form.neighborhood}
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
                name="postalCode"
                value={form.postalCode}
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
                name="city"
                value={form.city}
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
                name="state"
                value={form.state}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Municipio/Localidad
              </label>
              <input
                type="text"
                name="municipality"
                value={form.municipality}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RFC
              </label>
              <input
                type="text"
                name="rfc"
                value={form.rfc}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                pattern="[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}"
                title="Formato de RFC válido: 3-4 letras, 6 dígitos, 3 caracteres alfanuméricos"
              />
            </div>
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
              {loading ? "Actualizando..." : "Actualizar Proveedor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SupplierDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [supplier, setSupplier] = useState<SupplierDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  const supplierId = params.id as string;

  const fetchSupplier = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/suppliers/${supplierId}`, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Proveedor no encontrado");
        }
        throw new Error("Error al cargar el proveedor");
      }

      const data = await res.json();

      const supplierData = {
        ...data.supplier,
        purchases: data.supplier.purchases || [],
      };

      setSupplier(supplierData);
    } catch (err) {
      console.error("Error fetching supplier:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    if (supplierId) {
      fetchSupplier();
    }
  }, [supplierId, fetchSupplier]);

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar este proveedor?")) {
      return;
    }

    try {
      const res = await fetch(`/api/suppliers/${supplierId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al eliminar");
      }

      router.push("/dashboard/suppliers");
      router.refresh();
    } catch (err) {
      console.error("Error deleting supplier:", err);
      alert(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const handleEdit = (updatedSupplier: SupplierDetailsType) => {
    // Asegurarnos de que purchases siempre sea un array
    const supplierData = {
      ...updatedSupplier,
      purchases: updatedSupplier.purchases || [],
    };

    setSupplier(supplierData);
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
          href="/dashboard/suppliers"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Volver a proveedores
        </Link>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          No se pudo cargar la información del proveedor
        </div>
        <Link
          href="/dashboard/suppliers"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Volver a proveedores
        </Link>
      </div>
    );
  }

  // Asegurarnos de que purchases siempre tenga un valor por defecto
  const purchases = supplier.purchases || [];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <Link
            href="/dashboard/suppliers"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Volver a proveedores
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">{supplier.name}</h1>
          {supplier.contactName && (
            <p className="text-gray-600">Contacto: {supplier.contactName}</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Información de Contacto
          </h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">Teléfono:</span>
              <p className="text-gray-600">
                {supplier.phone || "No especificado"}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Email:</span>
              <p className="text-gray-600">
                {supplier.email || "No especificado"}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">RFC:</span>
              <p className="text-gray-600">
                {supplier.rfc || "No especificado"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Información de Compras
          </h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">
                Compras totales:
              </span>
              <p className="text-green-600 font-semibold">
                {formatCurrency(supplier.totalPurchases)}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Última compra:</span>
              <p className="text-gray-600">
                {supplier.lastPurchase
                  ? formatDate(supplier.lastPurchase)
                  : "Nunca"}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">
                Proveedor desde:
              </span>
              <p className="text-gray-600">
                {supplier.createdAt
                  ? formatDate(supplier.createdAt)
                  : "Fecha no disponible"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {(supplier.street ||
        supplier.neighborhood ||
        supplier.city ||
        supplier.state) && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Dirección
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supplier.street && (
              <div>
                <span className="font-medium text-gray-700">Calle:</span>
                <p className="text-gray-600">{supplier.street}</p>
              </div>
            )}
            {supplier.neighborhood && (
              <div>
                <span className="font-medium text-gray-700">Colonia:</span>
                <p className="text-gray-600">{supplier.neighborhood}</p>
              </div>
            )}
            {supplier.city && (
              <div>
                <span className="font-medium text-gray-700">Ciudad:</span>
                <p className="text-gray-600">{supplier.city}</p>
              </div>
            )}
            {supplier.state && (
              <div>
                <span className="font-medium text-gray-700">Estado:</span>
                <p className="text-gray-600">{supplier.state}</p>
              </div>
            )}
            {supplier.postalCode && (
              <div>
                <span className="font-medium text-gray-700">
                  Código Postal:
                </span>
                <p className="text-gray-600">{supplier.postalCode}</p>
              </div>
            )}
            {supplier.municipality && (
              <div>
                <span className="font-medium text-gray-700">Municipio:</span>
                <p className="text-gray-600">{supplier.municipality}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Últimas Compras ({purchases.length})
          </h2>
        </div>

        {purchases.length > 0 ? (
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
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(purchase.date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {purchase.purchaseItems?.length || 0} producto(s)
                      </div>
                      <div className="text-sm text-gray-500">
                        {purchase.purchaseItems
                          ?.slice(0, 2)
                          .map((item, index) => (
                            <span key={item.id}>
                              {item.product?.name || "Producto desconocido"}
                              {index <
                                (purchase.purchaseItems?.slice(0, 2).length ||
                                  0) -
                                  1 && ", "}
                            </span>
                          ))}
                        {(purchase.purchaseItems?.length || 0) > 2 && "..."}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-green-600">
                        {formatCurrency(purchase.totalAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          purchase.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : purchase.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {purchase.status === "completed"
                          ? "Completada"
                          : purchase.status === "pending"
                            ? "Pendiente"
                            : "Cancelada"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            No se han realizado compras con este proveedor
          </div>
        )}
      </div>

      {showEditModal && (
        <EditSupplierModal
          supplier={supplier}
          onClose={() => setShowEditModal(false)}
          onSupplierUpdated={handleEdit}
        />
      )}
    </div>
  );
}
