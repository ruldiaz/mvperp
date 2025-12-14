// src/app/dashboard/suppliers/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Supplier } from "@/types/supplier";

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchSuppliers = useCallback(
    async (page = 1, search = "") => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          ...(search && { search }),
        });

        const res = await fetch(`/api/suppliers?${params}`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Error al cargar los proveedores");

        const data = await res.json();
        setSuppliers(data.suppliers);
        setPagination(data.pagination);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los proveedores");
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuppliers(1, searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchSuppliers]);

  const handlePageChange = (newPage: number) => {
    fetchSuppliers(newPage, searchTerm);
  };

  const handleCreatePurchase = (supplierId: string) => {
    router.push(`/dashboard/purchases/create?supplierId=${supplierId}`);
  };

  if (loading && suppliers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex justify-center items-center">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl border border-gray-200 shadow-sm text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">
            Cargando proveedores...
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
                Proveedores
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl">
                Gestiona todos tus proveedores en un solo lugar
              </p>
            </div>
            <Link
              href="/dashboard/suppliers/create"
              className="mt-4 md:mt-0 bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              + Nuevo Proveedor
            </Link>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Barra de búsqueda y estadísticas */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="text-2xl bg-white p-3 rounded-xl shadow-sm">
                🔍
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar por nombre, contacto o RFC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-4 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Proveedores</p>
                <p className="text-3xl font-bold text-gray-800">
                  {pagination.totalCount}
                </p>
              </div>
              <div className="text-3xl">🏢</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="text-2xl bg-white p-3 rounded-xl shadow-sm">
                ⚠️
              </div>
              <div className="flex-1">
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de proveedores */}
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                  <th className="px-6 py-4 text-left font-semibold">
                    Proveedor
                  </th>
                  <th className="px-6 py-4 text-left font-semibold">
                    Contacto
                  </th>
                  <th className="px-6 py-4 text-left font-semibold">
                    Teléfono
                  </th>
                  <th className="px-6 py-4 text-left font-semibold">
                    Compras Totales
                  </th>
                  <th className="px-6 py-4 text-left font-semibold">
                    Última Compra
                  </th>
                  <th className="px-6 py-4 text-left font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="border-b border-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="bg-white p-2 rounded-lg shadow-sm mr-3 group-hover:shadow-md transition-shadow">
                          🏢
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            {supplier.name}
                          </div>
                          {supplier.rfc && (
                            <div className="text-sm text-gray-500">
                              {supplier.rfc}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-700">
                        {supplier.contactName || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-700">
                        {supplier.phone || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">
                        $
                        {supplier.totalPurchases.toLocaleString("es-MX", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-700">
                        {supplier.lastPurchase
                          ? new Date(supplier.lastPurchase).toLocaleDateString(
                              "es-MX"
                            )
                          : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCreatePurchase(supplier.id)}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-sm hover:shadow flex items-center"
                          title="Realizar compra"
                        >
                          <span className="mr-2">🛒</span>
                          Comprar
                        </button>
                        <Link
                          href={`/dashboard/suppliers/${supplier.id}`}
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-sm hover:shadow flex items-center"
                        >
                          <span className="mr-2">👁️</span>
                          Ver
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {suppliers.length === 0 && !loading && (
            <div className="p-12 text-center">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-8 rounded-2xl inline-block border border-gray-200">
                <div className="text-6xl mb-4">🏢</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {searchTerm
                    ? "No se encontraron proveedores"
                    : "No hay proveedores registrados"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm
                    ? "Intenta con otros términos de búsqueda"
                    : "Comienza registrando tu primer proveedor"}
                </p>
                <Link
                  href="/dashboard/suppliers/create"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  + Agregar Primer Proveedor
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-3">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              ← Anterior
            </button>

            <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 font-medium">
              Página {pagination.page} de {pagination.totalPages}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              Siguiente →
            </button>
          </div>
        )}

        {/* Enlaces rápidos */}
        <div className="mt-12 bg-gradient-to-r from-gray-900 to-gray-800 text-white py-8 px-6 rounded-2xl">
          <h3 className="text-xl font-bold mb-6 text-center">
            Acciones Rápidas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/purchases"
              className="bg-white/5 hover:bg-white/10 p-4 rounded-xl transition-all duration-200 group text-center"
            >
              <div className="text-2xl mb-2">📦</div>
              <div className="font-medium mb-1 group-hover:text-blue-300">
                Compras
              </div>
              <div className="text-sm text-gray-300">Ver todas las compras</div>
            </Link>
            <Link
              href="/dashboard/inventory"
              className="bg-white/5 hover:bg-white/10 p-4 rounded-xl transition-all duration-200 group text-center"
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="font-medium mb-1 group-hover:text-blue-300">
                Inventario
              </div>
              <div className="text-sm text-gray-300">Control de stock</div>
            </Link>
            <Link
              href="/dashboard/reports/suppliers"
              className="bg-white/5 hover:bg-white/10 p-4 rounded-xl transition-all duration-200 group text-center"
            >
              <div className="text-2xl mb-2">📈</div>
              <div className="font-medium mb-1 group-hover:text-blue-300">
                Reportes
              </div>
              <div className="text-sm text-gray-300">
                Análisis de proveedores
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
