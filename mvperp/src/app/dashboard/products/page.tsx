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
  const router = useRouter();

  // Cargar productos
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products", { credentials: "include" });
        if (!res.ok) throw new Error("Error al cargar los productos");
        const data = await res.json();
        setProducts(data.products);
        setFilteredProducts(data.products);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, []);

  // Filtrar productos cuando cambia el término de búsqueda
  useEffect(() => {
    if (!searchTerm) {
      setFilteredProducts(products);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          (product.sku && product.sku.toLowerCase().includes(term))
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Checkbox individual
  const handleCheckbox = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Borrar productos seleccionados
  const handleDeleteSelected = async () => {
    if (!confirm("¿Seguro que quieres borrar los productos seleccionados?"))
      return;

    try {
      for (const id of selectedIds) {
        const res = await fetch(`/api/products/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Error al borrar producto");
      }

      setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      alert("No se pudieron borrar los productos seleccionados");
    }
  };

  const goToDetail = (id: string) => {
    router.push(`/dashboard/products/${id}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Productos</h1>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Borrar seleccionado{selectedIds.length > 1 ? "s" : ""}
            </button>
          )}
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => router.push("/dashboard/products/create")}
          >
            Crear producto
          </button>
        </div>
      </div>

      {/* Input de búsqueda */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre o SKU..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-4 py-2">{/* Cabecera del checkbox */}</th>
            <th className="border px-4 py-2">Nombre</th>
            <th className="border px-4 py-2">SKU</th>
            <th className="border px-4 py-2">Stock</th>
            <th className="border px-4 py-2">Categoría</th>
            <th className="border px-4 py-2">Precio</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((p) => (
              <tr key={p.id} className="hover:bg-gray-100">
                <td className="border px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(p.id)}
                    onChange={() => handleCheckbox(p.id)}
                  />
                </td>
                <td
                  className="border px-4 py-2 cursor-pointer"
                  onClick={() => goToDetail(p.id)}
                >
                  {p.name}
                </td>
                <td className="border px-4 py-2">{p.sku || "-"}</td>
                <td className="border px-4 py-2">{p.stock ?? 0}</td>
                <td className="border px-4 py-2">{p.category ?? "-"}</td>
                <td className="border px-4 py-2">{p.price ?? 0}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="border px-4 py-2 text-center">
                {searchTerm
                  ? "No se encontraron productos"
                  : "No hay productos"}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
