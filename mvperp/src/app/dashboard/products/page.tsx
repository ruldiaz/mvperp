"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  // Cargar productos
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
        alert("Error al cargar los productos");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Filtrar productos
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

  // Paginación
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
      !confirm(`¿Seguro que quieres borrar ${selectedIds.length} producto(s)?`)
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
      if (failed.length > 0)
        throw new Error(`${failed.length} productos no se pudieron borrar`);
      setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      alert("Productos borrados exitosamente");
    } catch (err) {
      console.error(err);
      alert("Error al borrar algunos productos");
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
    const pageNumbers = [];
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

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Productos</h1>
          <div className="animate-pulse bg-gray-300 h-10 w-32 rounded"></div>
        </div>
        <div className="animate-pulse bg-gray-300 h-12 w-full mb-4 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-64 w-full rounded"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Productos</h1>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Borrar ({selectedIds.length})
            </button>
          )}
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => router.push("/dashboard/products/create")}
          >
            Crear producto
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={() => router.push("/dashboard/products/import")}
          >
            Importar CSV
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, SKU o categoría..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      {/* Selector items por página */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span>Mostrar</span>
          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="border p-1 rounded"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>productos por página</span>
        </div>
        <div className="text-sm text-gray-600">
          {filteredProducts.length} producto(s){" "}
          {searchTerm && `para "${searchTerm}"`}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="table-auto w-full border border-gray-300 border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-2 py-2 w-12">
                <input
                  type="checkbox"
                  checked={currentItems.every((p) =>
                    selectedIds.includes(p.id)
                  )}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="border px-2 py-2 max-w-[150px]">Nombre</th>
              <th className="border px-2 py-2 max-w-[100px]">SKU</th>
              <th className="border px-2 py-2 w-20">Stock</th>
              <th className="border px-2 py-2 max-w-[120px]">Categoría</th>
              <th className="border px-2 py-2 w-28">Precio</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((p) => (
                <tr key={p.id} className="hover:bg-gray-100">
                  <td className="border px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => handleCheckbox(p.id)}
                    />
                  </td>
                  <td
                    className="border px-2 py-2 cursor-pointer text-blue-600 hover:underline truncate max-w-[150px]"
                    onClick={() => goToDetail(p.id)}
                    title={p.name}
                  >
                    {p.name}
                  </td>
                  <td
                    className="border px-2 py-2 truncate max-w-[100px]"
                    title={p.sku || ""}
                  >
                    {p.sku || "-"}
                  </td>
                  <td className="border px-2 py-2 text-right w-20">
                    {p.stock ?? 0}
                  </td>
                  <td
                    className="border px-2 py-2 truncate max-w-[120px]"
                    title={p.category || ""}
                  >
                    {p.category || "-"}
                  </td>
                  <td className="border px-2 py-2 text-right w-28">
                    ${p.price?.toFixed(2) || "0.00"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="border px-2 py-2 text-center">
                  {searchTerm
                    ? "No se encontraron productos"
                    : "No hay productos"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {filteredProducts.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            Mostrando {indexOfFirstItem + 1} -{" "}
            {Math.min(indexOfLastItem, filteredProducts.length)} de{" "}
            {filteredProducts.length} productos
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              &laquo;
            </button>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              &lsaquo;
            </button>
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() =>
                  typeof page === "number" ? goToPage(page) : null
                }
                disabled={page === "..."}
                className={`px-3 py-1 border rounded ${currentPage === page ? "bg-blue-600 text-white" : ""} ${page === "..." ? "cursor-default" : "hover:bg-gray-200"}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              &rsaquo;
            </button>
            <button
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              &raquo;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
