"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Product } from "@/types/product";

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
      setOriginalForm(form);
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

  if (!form) return <p>Cargando...</p>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Botón para regresar */}
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
              onClick={handleBack}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Regresar
            </button>
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

      {/* Diálogo de confirmación para eliminar - SIN FONDO OSCURO */}
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
        className="flex flex-col gap-3"
      >
        <div>
          <label className="block text-sm font-medium mb-1">
            Nombre del producto
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
          <label className="block text-sm font-medium mb-1">Tipo</label>
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
          <label className="block text-sm font-medium mb-1">Categoría</label>
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
            <p className="border p-2 rounded bg-gray-50">{form.sku || "-"}</p>
          )}
        </div>

        <div className="flex gap-4 py-2">
          <label className="flex items-center gap-2">
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
            Vender en punto de venta
          </label>

          <label className="flex items-center gap-2">
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
            Incluir en catálogo en línea
          </label>

          <label className="flex items-center gap-2">
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
            Requerir receta médica
          </label>
        </div>

        {/* Repetir el mismo patrón para los demás campos */}

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
            <p className="border p-2 rounded bg-gray-50">{form.brand || "-"}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descripción</label>
          {isEditing ? (
            <textarea
              name="description"
              value={form.description || ""}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          ) : (
            <p className="border p-2 rounded bg-gray-50 min-h-[42px]">
              {form.description || "-"}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Cantidad</label>
          {isEditing ? (
            <input
              type="number"
              name="quantity"
              value={form.quantity ?? ""}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          ) : (
            <p className="border p-2 rounded bg-gray-50">
              {form.quantity ?? "-"}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Precio</label>
          {isEditing ? (
            <input
              type="number"
              name="price"
              value={form.price ?? ""}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          ) : (
            <p className="border p-2 rounded bg-gray-50">{form.price ?? "-"}</p>
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
              className="border p-2 rounded w-full"
            />
          ) : (
            <p className="border p-2 rounded bg-gray-50">{form.cost ?? "-"}</p>
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
            <p className="border p-2 rounded bg-gray-50">{form.stock ?? "-"}</p>
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
          <label className="block text-sm font-medium mb-1">IVA (%)</label>
          {isEditing ? (
            <input
              type="number"
              name="iva"
              value={form.iva ?? ""}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          ) : (
            <p className="border p-2 rounded bg-gray-50">{form.iva ?? "-"}</p>
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
              className="border p-2 rounded w-full"
            />
          ) : (
            <p className="border p-2 rounded bg-gray-50">{form.ieps ?? "-"}</p>
          )}
        </div>
      </form>
    </div>
  );
}
