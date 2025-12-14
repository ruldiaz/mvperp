// src/app/dashboard/products/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product, Variant, PriceList } from "@/types/product";
import { toast } from "react-hot-toast";

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

    if (target.type === "checkbox") {
      value = (target as HTMLInputElement).checked;
    } else if (target.type === "number") {
      value = target.value === "" ? undefined : Number(target.value);
    } else {
      value = target.value;
    }

    setForm((prev) => ({
      ...prev,
      [target.name]: value,
    }));
  };

  const handleAddVariant = () => {
    if (!newVariant.type || !newVariant.value) {
      toast.error("Completa ambos campos de variante");
      return;
    }
    setVariants([...variants, { ...newVariant, id: Date.now().toString() }]);
    setNewVariant({ type: "", value: "" });
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleAddPriceList = () => {
    if (!newPriceList.name || newPriceList.price <= 0) {
      toast.error("Nombre y precio válido requeridos");
      return;
    }
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
    if (!form.name.trim()) {
      toast.error("El nombre del producto es obligatorio");
      return;
    }
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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear producto");
      }

      toast.success("Producto creado exitosamente");
      router.push("/dashboard/products");
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : "Error desconocido al crear el producto";
      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Crear Producto</h1>
          <p className="text-gray-600 mt-1">
            Completa la información para registrar un nuevo producto
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl font-semibold shadow hover:shadow-lg transition-all duration-200 flex items-center gap-2"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Cancelar
        </button>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            Información Básica
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del producto *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Camisa de algodón"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo *
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="producto">Producto</option>
                  <option value="servicio">Servicio</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  name="sku"
                  value={form.sku || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Código único del producto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de barras
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={form.barcode || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <input
                  type="text"
                  name="category"
                  value={form.category || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ropa, Electrónicos, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marca
                </label>
                <input
                  type="text"
                  name="brand"
                  value={form.brand || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={form.description || ""}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Detalles del producto..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inventario y Precios */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              Inventario y Precios
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio principal
                </label>
                <input
                  type="number"
                  name="price"
                  value={form.price ?? ""}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Costo
                </label>
                <input
                  type="number"
                  name="cost"
                  value={form.cost ?? ""}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock inicial
                </label>
                <input
                  type="number"
                  name="stock"
                  value={form.stock ?? ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad mínima
                </label>
                <input
                  type="number"
                  name="minimumQuantity"
                  value={form.minimumQuantity ?? ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidad de venta
                </label>
                <input
                  type="text"
                  name="saleUnit"
                  value={form.saleUnit || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Pieza, Paquete, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación en almacén
                </label>
                <input
                  type="text"
                  name="location"
                  value={form.location || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Pasillo A, Estante 3"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {[
                  { name: "useStock", label: "Controlar stock" },
                  { name: "sellAtPOS", label: "Vender en punto de venta" },
                  {
                    name: "includeInCatalog",
                    label: "Incluir en catálogo en línea",
                  },
                  {
                    name: "requirePrescription",
                    label: "Requiere receta médica",
                  },
                ].map((field) => (
                  <div key={field.name} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name={field.name}
                      checked={Boolean(form[field.name as keyof Product])}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      {field.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Información Fiscal */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              Información Fiscal
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clave SAT (Producto)
                </label>
                <input
                  type="text"
                  name="satKey"
                  value={form.satKey || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10101500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clave SAT (Unidad)
                </label>
                <input
                  type="text"
                  name="satUnitKey"
                  value={form.satUnitKey || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="H87"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IVA (%)
                </label>
                <input
                  type="number"
                  name="iva"
                  value={form.iva ?? ""}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="16.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IEPS (%)
                </label>
                <input
                  type="number"
                  name="ieps"
                  value={form.ieps ?? ""}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  name="ivaIncluded"
                  checked={Boolean(form.ivaIncluded)}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">
                  Precio incluye IVA
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Variantes */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
            Variantes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <input
              type="text"
              placeholder="Tipo (color, talla...)"
              value={newVariant.type}
              onChange={(e) =>
                setNewVariant({ ...newVariant, type: e.target.value })
              }
              className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Valor (rojo, L...)"
              value={newVariant.value}
              onChange={(e) =>
                setNewVariant({ ...newVariant, value: e.target.value })
              }
              className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleAddVariant}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-xl font-medium shadow hover:shadow-md transition-all"
            >
              Agregar Variante
            </button>
          </div>

          {variants.length > 0 ? (
            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl"
                >
                  <span className="font-medium">
                    <span className="text-gray-600">{variant.type}:</span>{" "}
                    {variant.value}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(index)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No hay variantes definidas
            </p>
          )}
        </div>

        {/* Listas de Precios */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            Listas de Precios
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <input
              type="text"
              placeholder="Nombre (Mayoreo, Minorista...)"
              value={newPriceList.name}
              onChange={(e) =>
                setNewPriceList({ ...newPriceList, name: e.target.value })
              }
              className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleAddPriceList}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-xl font-medium shadow hover:shadow-md transition-all"
            >
              Agregar Lista
            </button>
          </div>

          {priceLists.length > 0 ? (
            <div className="space-y-3">
              {priceLists.map((priceList, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl"
                >
                  <span className="font-medium">
                    <span className="text-gray-600">{priceList.name}:</span>{" "}
                    {formatCurrency(priceList.price)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemovePriceList(index)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No hay listas de precios definidas
            </p>
          )}
        </div>

        {/* Botón de envío */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
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
                Creando producto...
              </>
            ) : (
              <>
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
                Crear Producto
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
