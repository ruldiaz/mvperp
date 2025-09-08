// src/app/dashboard/products/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Product, Variant, PriceList } from "@/types/product";

export default function ProductDetail() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [form, setForm] = useState<Product | null>(null);
  const [originalForm, setOriginalForm] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newVariant, setNewVariant] = useState<Omit<Variant, "id">>({
    type: "",
    value: "",
  });
  const [newPriceList, setNewPriceList] = useState<Omit<PriceList, "id">>({
    name: "",
    price: 0,
  });

  // Cargar producto
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Error al cargar el producto");
        const data = await res.json();
        setForm(data.product);
        setOriginalForm(data.product);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar el producto");
      }
    };
    fetchProduct();
  }, [productId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const target = e.target;

    let newValue: string | number | boolean | undefined;

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      newValue = target.checked;
    } else if (target instanceof HTMLInputElement && target.type === "number") {
      newValue = target.value === "" ? undefined : Number(target.value);
    } else {
      newValue = target.value;
    }

    setForm((prev) => (prev ? { ...prev, [target.name]: newValue } : prev));
  };

  const handleAddVariant = () => {
    if (!newVariant.type || !newVariant.value) return;

    setForm((prev) =>
      prev
        ? {
            ...prev,
            variants: [
              ...(prev.variants || []),
              { ...newVariant, id: Date.now().toString() },
            ],
          }
        : prev
    );

    setNewVariant({ type: "", value: "" });
  };

  const handleRemoveVariant = (index: number) => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            variants: prev.variants?.filter((_, i) => i !== index) || [],
          }
        : prev
    );
  };

  const handleAddPriceList = () => {
    if (!newPriceList.name || newPriceList.price <= 0) return;

    setForm((prev) =>
      prev
        ? {
            ...prev,
            priceLists: [
              ...(prev.priceLists || []),
              { ...newPriceList, id: Date.now().toString() },
            ],
          }
        : prev
    );

    setNewPriceList({ name: "", price: 0 });
  };

  const handleRemovePriceList = (index: number) => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            priceLists: prev.priceLists?.filter((_, i) => i !== index) || [],
          }
        : prev
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error al actualizar producto");

      // Actualizar también el formulario original
      const updatedData = await res.json();
      setForm(updatedData.product);
      setOriginalForm(updatedData.product);
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Error al actualizar el producto");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Restaurar los valores originales
    setForm(originalForm);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error al eliminar producto");

      router.push("/dashboard/products");
    } catch (err) {
      console.error(err);
      setError("Error al eliminar el producto");
    }
  };

  const handleBack = () => {
    router.push("/dashboard/products");
  };

  if (!form) return <div className="p-4">Cargando...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <button
        onClick={handleBack}
        className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Volver a productos
      </button>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          {isEditing ? "Editar Producto" : "Detalles del Producto"}
        </h1>

        {!isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Editar
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Eliminar
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="product-form"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loading ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-red-600 mb-2">{error}</p>}

      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full border border-gray-300">
            <h3 className="text-xl font-bold mb-4">Confirmar eliminación</h3>
            <p className="mb-6">
              ¿Estás seguro de que quieres eliminar el producto {form.name}?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <form
        id="product-form"
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
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="border p-2 rounded w-full"
                />
              ) : (
                <p className="border p-2 rounded bg-gray-50">{form.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tipo *</label>
              {isEditing ? (
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                >
                  <option value="producto">Producto</option>
                  <option value="servicio">Servicio</option>
                </select>
              ) : (
                <p className="border p-2 rounded bg-gray-50 capitalize">
                  {form.type}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">SKU</label>
              {isEditing ? (
                <input
                  type="text"
                  name="sku"
                  value={form.sku || ""}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              ) : (
                <p className="border p-2 rounded bg-gray-50">
                  {form.sku || "-"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Código de barras
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="barcode"
                  value={form.barcode || ""}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              ) : (
                <p className="border p-2 rounded bg-gray-50">
                  {form.barcode || "-"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Categoría
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="category"
                  value={form.category || ""}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              ) : (
                <p className="border p-2 rounded bg-gray-50">
                  {form.category || "-"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Marca</label>
              {isEditing ? (
                <input
                  type="text"
                  name="brand"
                  value={form.brand || ""}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              ) : (
                <p className="border p-2 rounded bg-gray-50">
                  {form.brand || "-"}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Descripción
              </label>
              {isEditing ? (
                <textarea
                  name="description"
                  value={form.description || ""}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                  rows={3}
                />
              ) : (
                <p className="border p-2 rounded bg-gray-50 min-h-[42px]">
                  {form.description || "-"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Inventario y Precios */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Inventario y Precios</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Precio</label>
              {isEditing ? (
                <input
                  type="number"
                  name="price"
                  value={form.price ?? ""}
                  onChange={handleChange}
                  step="0.01"
                  className="border p-2 rounded w-full"
                />
              ) : (
                <p className="border p-2 rounded bg-gray-50">
                  ${form.price ?? "0"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Costo</label>
              {isEditing ? (
                <input
                  type="number"
                  name="cost"
                  value={form.cost ?? ""}
                  onChange={handleChange}
                  step="0.01"
                  className="border p-2 rounded w-full"
                />
              ) : (
                <p className="border p-2 rounded bg-gray-50">
                  ${form.cost ?? "0"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Stock</label>
              {isEditing ? (
                <input
                  type="number"
                  name="stock"
                  value={form.stock ?? ""}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              ) : (
                <p className="border p-2 rounded bg-gray-50">
                  {form.stock ?? "0"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Cantidad mínima
              </label>
              {isEditing ? (
                <input
                  type="number"
                  name="minimumQuantity"
                  value={form.minimumQuantity ?? ""}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              ) : (
                <p className="border p-2 rounded bg-gray-50">
                  {form.minimumQuantity ?? "-"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Unidad de venta
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="saleUnit"
                  value={form.saleUnit || ""}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              ) : (
                <p className="border p-2 rounded bg-gray-50">
                  {form.saleUnit || "-"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Ubicación
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="location"
                  value={form.location || ""}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              ) : (
                <p className="border p-2 rounded bg-gray-50">
                  {form.location || "-"}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <input
                  type="checkbox"
                  name="useStock"
                  checked={form.useStock}
                  onChange={handleChange}
                />
              ) : (
                <input
                  type="checkbox"
                  checked={form.useStock}
                  disabled
                  className="accent-gray-500"
                />
              )}
              <label className="text-sm font-medium">
                Usar control de stock
              </label>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <input
                  type="checkbox"
                  name="sellAtPOS"
                  checked={form.sellAtPOS}
                  onChange={handleChange}
                />
              ) : (
                <input
                  type="checkbox"
                  checked={form.sellAtPOS}
                  disabled
                  className="accent-gray-500"
                />
              )}
              <label className="text-sm font-medium">
                Vender en punto de venta
              </label>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <input
                  type="checkbox"
                  name="includeInCatalog"
                  checked={form.includeInCatalog}
                  onChange={handleChange}
                />
              ) : (
                <input
                  type="checkbox"
                  checked={form.includeInCatalog}
                  disabled
                  className="accent-gray-500"
                />
              )}
              <label className="text-sm font-medium">
                Incluir en catálogo en línea
              </label>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <input
                  type="checkbox"
                  name="requirePrescription"
                  checked={form.requirePrescription}
                  onChange={handleChange}
                />
              ) : (
                <input
                  type="checkbox"
                  checked={form.requirePrescription}
                  disabled
                  className="accent-gray-500"
                />
              )}
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
              {isEditing ? (
                <input
                  type="text"
                  name="satKey"
                  value={form.satKey || ""}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              ) : (
                <p className="border p-2 rounded bg-gray-50">
                  {form.satKey || "-"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Clave Unidad SAT
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="satUnitKey"
                  value={form.satUnitKey || ""}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              ) : (
                <p className="border p-2 rounded bg-gray-50">
                  {form.satUnitKey || "-"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">IVA (%)</label>
              {isEditing ? (
                <input
                  type="number"
                  name="iva"
                  value={form.iva ?? ""}
                  onChange={handleChange}
                  step="0.01"
                  className="border p-2 rounded w-full"
                />
              ) : (
                <p className="border p-2 rounded bg-gray-50">
                  {form.iva ?? "-"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">IEPS (%)</label>
              {isEditing ? (
                <input
                  type="number"
                  name="ieps"
                  value={form.ieps ?? ""}
                  onChange={handleChange}
                  step="0.01"
                  className="border p-2 rounded w-full"
                />
              ) : (
                <p className="border p-2 rounded bg-gray-50">
                  {form.ieps ?? "-"}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <input
                  type="checkbox"
                  name="ivaIncluded"
                  checked={form.ivaIncluded}
                  onChange={handleChange}
                />
              ) : (
                <input
                  type="checkbox"
                  checked={form.ivaIncluded}
                  disabled
                  className="accent-gray-500"
                />
              )}
              <label className="text-sm font-medium">Precio incluye IVA</label>
            </div>
          </div>
        </div>

        {/* Variantes */}
        {isEditing && (
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

            {form.variants && form.variants.length > 0 ? (
              <div className="border rounded">
                {form.variants.map((variant, index) => (
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
        )}

        {/* Listas de Precios */}
        {isEditing && (
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

            {form.priceLists && form.priceLists.length > 0 ? (
              <div className="border rounded">
                {form.priceLists.map((priceList, index) => (
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
              <p className="text-gray-500">
                No hay listas de precios definidas
              </p>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
