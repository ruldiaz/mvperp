// src/app/dashboard/suppliers/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  totalPurchases: number;
  lastPurchase?: string;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Cargar proveedores
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await fetch("/api/suppliers", { credentials: "include" });
        if (!res.ok) throw new Error("Error al cargar los proveedores");
        const data = await res.json();
        setSuppliers(data.suppliers);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los proveedores");
      }
    };
    fetchSuppliers();
  }, []);

  const handleCreatePurchase = (supplierId: string) => {
    router.push(`/dashboard/purchases/create?supplierId=${supplierId}`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Proveedores</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Agregar Proveedor
        </button>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-4 py-2">Nombre</th>
            <th className="border px-4 py-2">Contacto</th>
            <th className="border px-4 py-2">Teléfono</th>
            <th className="border px-4 py-2">Compras Totales</th>
            <th className="border px-4 py-2">Última Compra</th>
            <th className="border px-4 py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => (
            <tr key={supplier.id} className="hover:bg-gray-100">
              <td className="border px-4 py-2">{supplier.name}</td>
              <td className="border px-4 py-2">
                {supplier.contactName || "-"}
              </td>
              <td className="border px-4 py-2">{supplier.phone || "-"}</td>
              <td className="border px-4 py-2">
                ${supplier.totalPurchases.toFixed(2)}
              </td>
              <td className="border px-4 py-2">
                {supplier.lastPurchase
                  ? new Date(supplier.lastPurchase).toLocaleDateString()
                  : "-"}
              </td>
              <td className="border px-4 py-2 text-center">
                <button
                  onClick={() => handleCreatePurchase(supplier.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Realizar Compra
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal para crear proveedor */}
      {showModal && (
        <SupplierModal
          onClose={() => setShowModal(false)}
          onSupplierCreated={(newSupplier) => {
            setSuppliers((prev) => [...prev, newSupplier]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

// Componente Modal para crear proveedor
function SupplierModal({
  onClose,
  onSupplierCreated,
}: {
  onClose: () => void;
  onSupplierCreated: (supplier: Supplier) => void;
}) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error al crear proveedor");

      const data = await res.json();
      onSupplierCreated(data.supplier);
    } catch (err) {
      console.error(err);
      setError("Error al crear el proveedor");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Agregar Proveedor</h2>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">
              Nombre del Proveedor *
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Nombre de Contacto
            </label>
            <input
              type="text"
              name="contactName"
              value={form.contactName}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Calle</label>
            <input
              type="text"
              name="street"
              value={form.street}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Colonia</label>
            <input
              type="text"
              name="neighborhood"
              value={form.neighborhood}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Código Postal
            </label>
            <input
              type="text"
              name="postalCode"
              value={form.postalCode}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ciudad</label>
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Estado</label>
            <input
              type="text"
              name="state"
              value={form.state}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Municipio/Localidad
            </label>
            <input
              type="text"
              name="municipality"
              value={form.municipality}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">RFC</label>
            <input
              type="text"
              name="rfc"
              value={form.rfc}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div className="col-span-2 flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loading ? "Creando..." : "Crear Proveedor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
