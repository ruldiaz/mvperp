"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface Product {
  id: string;
  name: string;
  stock?: number;
  category?: string;
  price?: number;
  sku?: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/products", { credentials: "include" });
        if (!res.ok) throw new Error("Error al cargar los productos");
        const data = await res.json();
        setProducts(data.products || []);
        setFilteredProducts(data.products || []);
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar los productos");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredProducts(products);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredProducts(
        products.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            (p.sku && p.sku.toLowerCase().includes(term)) ||
            (p.category && p.category.toLowerCase().includes(term))
        )
      );
    }
    setCurrentPage(1);
  }, [searchTerm, products]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleCheckbox = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const currentPageIds = currentItems.map((p) => p.id);
    if (currentPageIds.every((id) => selectedIds.includes(id))) {
      setSelectedIds((prev) =>
        prev.filter((id) => !currentPageIds.includes(id))
      );
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...currentPageIds])]);
    }
  };

  const handleDeleteSelected = async () => {
    if (
      !confirm(
        `¿Seguro que quieres borrar ${selectedIds.length} producto(s)? Esta acción no se puede deshacer.`
      )
    )
      return;
    try {
      const deletePromises = selectedIds.map((id) =>
        fetch(`/api/products/${id}`, {
          method: "DELETE",
          credentials: "include",
        })
      );
      const results = await Promise.allSettled(deletePromises);
      const failed = results.filter(
        (r) => r.status === "rejected" || !("value" in r && r.value.ok)
      );
      if (failed.length > 0) {
        toast.error(`${failed.length} productos no se pudieron borrar`);
        throw new Error(`${failed.length} productos fallaron`);
      }
      setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      toast.success("Productos eliminados exitosamente");
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar productos");
    }
  };

  const goToDetail = (id: string) => {
    router.push(`/dashboard/products/${id}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchTerm(e.target.value);

  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++)
          pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  const formatCurrency = (amount?: number) => {
    if (amount == null) return "—";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Productos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tu catálogo de productos
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Borrar ({selectedIds.length})
            </button>
          )}

          <button
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            onClick={() => router.push("/dashboard/products/create")}
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
            Crear producto
          </button>

          <button
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            onClick={() => router.push("/dashboard/products/import")}
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
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
            Importar CSV
          </button>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar por nombre, SKU o categoría..."
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

      <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <span>Mostrar</span>
          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
          </select>
        </div>
        <div>
          {filteredProducts.length} producto(s)
          {searchTerm && ` para "${searchTerm}"`}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                <th className="px-6 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={
                      currentItems.length > 0 &&
                      currentItems.every((p) => selectedIds.includes(p.id))
                    }
                    onChange={handleSelectAll}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Precio
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentItems.length > 0 ? (
                currentItems.map((p) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-gray-50 transition-colors duration-150 ${selectedIds.includes(p.id) ? "bg-blue-50" : ""}`}
                  >
                    <td className="px-6 py-5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => handleCheckbox(p.id)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td
                      className="px-6 py-5 font-medium text-blue-600 hover:underline cursor-pointer max-w-xs truncate"
                      onClick={() => goToDetail(p.id)}
                      title={p.name}
                    >
                      {p.name}
                    </td>
                    <td
                      className="px-6 py-5 text-gray-700 max-w-xs truncate"
                      title={p.sku || ""}
                    >
                      {p.sku || "—"}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          (p.stock || 0) <= 5
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {p.stock ?? 0}
                      </span>
                    </td>
                    <td
                      className="px-6 py-5 text-gray-700 max-w-xs truncate"
                      title={p.category || ""}
                    >
                      {p.category || "—"}
                    </td>
                    <td className="px-6 py-5 font-medium text-green-600">
                      {formatCurrency(p.price)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    {searchTerm ? (
                      <div className="flex flex-col items-center gap-3">
                        <svg
                          className="w-12 h-12 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p>No se encontraron productos para {searchTerm}</p>
                      </div>
                    ) : (
                      "No hay productos registrados"
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {filteredProducts.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-2 py-4">
          <p className="text-sm text-gray-600">
            Mostrando{" "}
            <span className="font-medium">{indexOfFirstItem + 1}</span> –{" "}
            <span className="font-medium">
              {Math.min(indexOfLastItem, filteredProducts.length)}
            </span>{" "}
            de <span className="font-medium">{filteredProducts.length}</span>{" "}
            productos
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &laquo;
            </button>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &lsaquo;
            </button>

            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === "number" && goToPage(page)}
                disabled={page === "..."}
                className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                  currentPage === page
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                } ${page === "..." ? "cursor-default bg-gray-100" : "transition-colors duration-150"}`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &rsaquo;
            </button>
            <button
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &raquo;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
