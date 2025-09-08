// src/app/dashboard/products/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product, Variant, PriceList } from "@/types/product";

export default function CreateProduct() {
  const router = useRouter();
  const [form, setForm] = useState<Product>({
    name: "",
    type: "producto",
    sellAtPOS: false,
    includeInCatalog: false,
    requirePrescription: false,
    useStock: true,
    ivaIncluded: true,
  });
  const [variants, setVariants] = useState<Variant[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [newVariant, setNewVariant] = useState<Omit<Variant, "id">>({
    type: "",
    value: "",
  });
  const [newPriceList, setNewPriceList] = useState<Omit<PriceList, "id">>({
    name: "",
    price: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const target = e.target;

    let value: string | number | boolean | undefined;

    if (target instanceof HTMLInputElement) {
      if (target.type === "checkbox") {
        value = target.checked;
      } else if (target.type === "number") {
        value = target.value === "" ? undefined : Number(target.value);
      } else {
        value = target.value;
      }
    } else if (
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement
    ) {
      value = target.value;
    }

    setForm((prev) => ({
      ...prev,
      [target.name]: value,
    }));
  };

  const handleAddVariant = () => {
    if (!newVariant.type || !newVariant.value) return;
    setVariants([...variants, { ...newVariant, id: Date.now().toString() }]);
    setNewVariant({ type: "", value: "" });
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleAddPriceList = () => {
    if (!newPriceList.name || newPriceList.price <= 0) return;
    setPriceLists([
      ...priceLists,
      { ...newPriceList, id: Date.now().toString() },
    ]);
    setNewPriceList({ name: "", price: 0 });
  };

  const handleRemovePriceList = (index: number) => {
    setPriceLists(priceLists.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const productData = {
        ...form,
        variants,
        priceLists,
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error al crear producto");

      router.push("/dashboard/products");
    } catch (err: unknown) {
      console.error(err);
      setError("Error desconocido al crear el producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Crear Producto</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Información básica */}
        <div className="md:col-span-2 bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Información Básica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nombre del producto *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tipo *</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              >
                <option value="producto">Producto</option>
                <option value="servicio">Servicio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">SKU</label>
              <input
                type="text"
                name="sku"
                value={form.sku || ""}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Código de barras
              </label>
              <input
                type="text"
                name="barcode"
                value={form.barcode || ""}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Categoría
              </label>
              <input
                type="text"
                name="category"
                value={form.category || ""}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Marca</label>
              <input
                type="text"
                name="brand"
                value={form.brand || ""}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Descripción
              </label>
              <textarea
                name="description"
                value={form.description || ""}
                onChange={handleChange}
                className="border p-2 rounded w-full"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Inventario y Precios */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Inventario y Precios</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Precio</label>
              <input
                type="number"
                name="price"
                value={form.price ?? ""}
                onChange={handleChange}
                step="0.01"
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Costo</label>
              <input
                type="number"
                name="cost"
                value={form.cost ?? ""}
                onChange={handleChange}
                step="0.01"
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Stock</label>
              <input
                type="number"
                name="stock"
                value={form.stock ?? ""}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Cantidad mínima
              </label>
              <input
                type="number"
                name="minimumQuantity"
                value={form.minimumQuantity ?? ""}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Unidad de venta
              </label>
              <input
                type="text"
                name="saleUnit"
                value={form.saleUnit || ""}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Ubicación
              </label>
              <input
                type="text"
                name="location"
                value={form.location || ""}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="useStock"
                checked={form.useStock}
                onChange={handleChange}
              />
              <label className="text-sm font-medium">
                Usar control de stock
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="sellAtPOS"
                checked={form.sellAtPOS}
                onChange={handleChange}
              />
              <label className="text-sm font-medium">
                Vender en punto de venta
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="includeInCatalog"
                checked={form.includeInCatalog}
                onChange={handleChange}
              />
              <label className="text-sm font-medium">
                Incluir en catálogo en línea
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="requirePrescription"
                checked={form.requirePrescription}
                onChange={handleChange}
              />
              <label className="text-sm font-medium">
                Requerir receta médica
              </label>
            </div>
          </div>
        </div>

        {/* Información Fiscal */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Información Fiscal</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Clave SAT
              </label>
              <input
                type="text"
                name="satKey"
                value={form.satKey || ""}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Clave Unidad SAT
              </label>
              <input
                type="text"
                name="satUnitKey"
                value={form.satUnitKey || ""}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">IVA (%)</label>
              <input
                type="number"
                name="iva"
                value={form.iva ?? ""}
                onChange={handleChange}
                step="0.01"
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">IEPS (%)</label>
              <input
                type="number"
                name="ieps"
                value={form.ieps ?? ""}
                onChange={handleChange}
                step="0.01"
                className="border p-2 rounded w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="ivaIncluded"
                checked={form.ivaIncluded}
                onChange={handleChange}
              />
              <label className="text-sm font-medium">Precio incluye IVA</label>
            </div>
          </div>
        </div>

        {/* Variantes */}
        <div className="md:col-span-2 bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Variantes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Tipo (color, tamaño, etc.)"
              value={newVariant.type}
              onChange={(e) =>
                setNewVariant({ ...newVariant, type: e.target.value })
              }
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Valor (rojo, XL, etc.)"
              value={newVariant.value}
              onChange={(e) =>
                setNewVariant({ ...newVariant, value: e.target.value })
              }
              className="border p-2 rounded"
            />
            <button
              type="button"
              onClick={handleAddVariant}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Agregar Variante
            </button>
          </div>

          {variants.length > 0 ? (
            <div className="border rounded">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-2 border-b"
                >
                  <span>
                    {variant.type}: {variant.value}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No hay variantes definidas</p>
          )}
        </div>

        {/* Listas de Precios */}
        <div className="md:col-span-2 bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Listas de Precios</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Nombre de lista (Mayoreo, Menudeo)"
              value={newPriceList.name}
              onChange={(e) =>
                setNewPriceList({ ...newPriceList, name: e.target.value })
              }
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Precio"
              value={newPriceList.price}
              onChange={(e) =>
                setNewPriceList({
                  ...newPriceList,
                  price: Number(e.target.value),
                })
              }
              step="0.01"
              className="border p-2 rounded"
            />
            <button
              type="button"
              onClick={handleAddPriceList}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Agregar Lista
            </button>
          </div>

          {priceLists.length > 0 ? (
            <div className="border rounded">
              {priceLists.map((priceList, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-2 border-b"
                >
                  <span>
                    {priceList.name}: ${priceList.price}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemovePriceList(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No hay listas de precios definidas</p>
          )}
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? "Creando..." : "Crear Producto"}
          </button>
        </div>
      </form>
    </div>
  );
}
