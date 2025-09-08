// src/app/dashboard/purchases/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Purchase } from "@/types/purchase";

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await fetch("/api/purchases", { credentials: "include" });
        if (!res.ok) throw new Error("Error al cargar las compras");
        const data = await res.json();
        setPurchases(data.purchases);
        setFilteredPurchases(data.purchases);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchases();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredPurchases(purchases);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = purchases.filter(
        (purchase) =>
          purchase.supplier.name.toLowerCase().includes(term) ||
          purchase.user.name.toLowerCase().includes(term) ||
          purchase.status.toLowerCase().includes(term)
      );
      setFilteredPurchases(filtered);
    }
  }, [searchTerm, purchases]);

  const goToDetail = (id: string) => {
    router.push(`/dashboard/purchases/${id}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-MX");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Cargando compras...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Compras</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => router.push("/dashboard/purchases/create")}
        >
          Nueva Compra
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por proveedor, usuario o estado..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-4 py-2">Compra</th>
              <th className="border px-4 py-2">Fecha</th>
              <th className="border px-4 py-2">Registrado por</th>
              <th className="border px-4 py-2">Proveedor</th>
              <th className="border px-4 py-2">Estado</th>
              <th className="border px-4 py-2">Total</th>
              <th className="border px-4 py-2">Deuda</th>
            </tr>
          </thead>
          <tbody>
            {filteredPurchases.length > 0 ? (
              filteredPurchases.map((purchase) => (
                <tr
                  key={purchase.id}
                  className="hover:bg-gray-100 cursor-pointer"
                  onClick={() => goToDetail(purchase.id)}
                >
                  <td className="border px-4 py-2">
                    #{purchase.id.slice(0, 8)}
                  </td>
                  <td className="border px-4 py-2">
                    {formatDate(purchase.date)}
                  </td>
                  <td className="border px-4 py-2">{purchase.user.name}</td>
                  <td className="border px-4 py-2">{purchase.supplier.name}</td>
                  <td className="border px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
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
                  <td className="border px-4 py-2">
                    {formatCurrency(purchase.totalAmount)}
                  </td>
                  <td className="border px-4 py-2">
                    {formatCurrency(purchase.debt || 0)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="border px-4 py-2 text-center">
                  {searchTerm
                    ? "No se encontraron compras"
                    : "No hay compras registradas"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
