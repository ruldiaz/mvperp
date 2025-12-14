// src/app/dashboard/purchases/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Purchase } from "@/types/purchase";
import { toast } from "react-hot-toast";

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
        setPurchases(data.purchases || []);
        setFilteredPurchases(data.purchases || []);
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar las compras");
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
      const filtered = purchases.filter((purchase) => {
        const supplierName = purchase.supplier?.name || "";
        const userName = purchase.user?.name || "";
        const status = purchase.status || "";
        return (
          supplierName.toLowerCase().includes(term) ||
          userName.toLowerCase().includes(term) ||
          status.toLowerCase().includes(term)
        );
      });
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

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
    });
  };

  const getStatusBadge = (status: string) => {
    const config = {
      completed: {
        color: "from-green-100 to-emerald-100 text-green-800",
        label: "COMPLETADA",
        icon: "✅",
      },
      pending: {
        color: "from-yellow-100 to-amber-100 text-yellow-800",
        label: "PENDIENTE",
        icon: "⏳",
      },
      cancelled: {
        color: "from-red-100 to-pink-100 text-red-800",
        label: "CANCELADA",
        icon: "❌",
      },
    };
    const selected = config[status as keyof typeof config] || {
      color: "from-gray-100 to-gray-200 text-gray-800",
      label: status?.toUpperCase() || "DESCONOCIDO",
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
          <p className="text-gray-600 font-medium">Cargando compras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Compras</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tus compras a proveedores
          </p>
        </div>

        <button
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          onClick={() => router.push("/dashboard/purchases/create")}
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Nueva Compra
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por proveedor, usuario o estado..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full sm:w-96 border border-gray-300 rounded-xl px-5 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
          <svg
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mx-4 sm:mx-6 lg:mx-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Compra
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Registrado por
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Deuda
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPurchases.length > 0 ? (
                filteredPurchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                    onClick={() => goToDetail(purchase.id)}
                  >
                    <td className="px-6 py-5 font-bold text-blue-600">
                      #{purchase.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-5 text-gray-700">
                      {formatDate(purchase.date)}
                    </td>
                    <td className="px-6 py-5 text-gray-800">
                      {purchase.user?.name || "—"}
                    </td>
                    <td className="px-6 py-5 text-gray-800">
                      {purchase.supplier?.name || "—"}
                    </td>
                    <td className="px-6 py-5">
                      {getStatusBadge(purchase.status)}
                    </td>
                    <td className="px-6 py-5 font-semibold text-green-600">
                      {formatCurrency(purchase.totalAmount)}
                    </td>
                    <td className="px-6 py-5 font-medium">
                      {formatCurrency(purchase.debt || 0)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    {searchTerm
                      ? "No se encontraron compras para tu búsqueda"
                      : "No hay compras registradas"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
