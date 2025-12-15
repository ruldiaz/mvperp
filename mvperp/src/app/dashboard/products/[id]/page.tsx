// src/app/dashboard/products/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Product, Variant, PriceList } from "@/types/product";
import Image from "next/image";
import { toast } from "react-hot-toast";

export default function ProductDetail() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const [form, setForm] = useState<Product | null>(null);
  const [image, setImage] = useState("");
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
  const [imageFile, setImageFile] = useState<File | null>(null);

  const fetchImage = async (imageKey: string) => {
    try {
      const res = await fetch(`/api/proxyImage?imageKey=${imageKey}`);
      if (!res.ok) throw new Error("Error al cargar la imagen");
      const data = await res.json();
      setImage(data.imageUrl);
    } catch (error) {
      console.error(error);
      setImage("/placeholder-image.png");
      setError("No se pudo cargar la imagen");
    }
  };

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
        if (data.product.image) {
          setImage(data.product.image);
        } else if (data.product.sku) {
          fetchImage(data.product.sku);
        }
      } catch (err) {
        console.error(err);
        toast.error("No se pudo cargar el producto");
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
    if (target.type === "checkbox") {
      newValue = (target as HTMLInputElement).checked;
    } else if (target.type === "number") {
      newValue = target.value === "" ? undefined : Number(target.value);
    } else {
      newValue = target.value;
    }
    setForm((prev) => (prev ? { ...prev, [target.name]: newValue } : prev));
  };

  const handleAddVariant = () => {
    if (!newVariant.type || !newVariant.value) {
      toast.error("Completa ambos campos de variante");
      return;
    }
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
    if (!newPriceList.name || newPriceList.price <= 0) {
      toast.error("Nombre y precio válido requeridos");
      return;
    }
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

    try {
      const formData = new FormData();
      formData.append("product", JSON.stringify(form));
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error al actualizar producto");
      const updatedData = await res.json();
      setForm(updatedData.product);
      setOriginalForm(updatedData.product);
      setIsEditing(false);
      toast.success("Producto actualizado exitosamente");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar el producto");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm(originalForm);
    setIsEditing(false);
    setImageFile(null);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al eliminar producto");
      toast.success("Producto eliminado exitosamente");
      router.push("/dashboard/products");
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar el producto");
    }
  };

  const handleBack = () => {
    router.push("/dashboard/products");
  };

  const formatCurrency = (amount?: number) => {
    if (amount == null) return "$0.00";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  if (!form) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando producto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button
            onClick={handleBack}
            className="text-blue-600 hover:text-blue-800 font-medium mb-3 inline-flex items-center gap-2 group"
          >
            <svg
              className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver a productos
          </button>
          <h1 className="text-3xl font-bold text-gray-800">
            {isEditing ? "Editar Producto" : "Detalles del Producto"}
          </h1>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow hover:shadow-lg transition-all duration-200 flex items-center gap-2"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Editar
          </button>
        ) : (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-5 py-3 rounded-xl font-semibold shadow hover:shadow-lg transition-all duration-200 flex items-center gap-2"
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
              Eliminar
            </button>
            <button
              onClick={handleCancel}
              className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-5 py-3 rounded-xl font-semibold shadow hover:shadow-lg transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="product-form"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl font-semibold shadow hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
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
                  Actualizando...
                </>
              ) : (
                "Actualizar"
              )}
            </button>
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                Confirmar eliminación
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar el producto{" "}
              <span className="font-semibold text-blue-700">{form.name}</span>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-md transition-all"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
          {error}
        </div>
      )}

      <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen del producto
              </label>
              <div className="relative w-full h-64 border border-gray-300 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                {image ? (
                  <Image
                    src={image}
                    alt={form.name || "Imagen del producto"}
                    fill
                    className="object-contain p-4"
                    onError={() => setImage("/placeholder-image.png")}
                  />
                ) : (
                  <span className="text-gray-500">Sin imagen</span>
                )}
              </div>
              {isEditing && form.sku && !form.image && (
                <p className="text-xs text-gray-500 mt-2">
                  Imagen asociada al SKU:{" "}
                  <span className="font-mono">{form.sku}</span>
                </p>
              )}

              {isEditing && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subir imagen local (opcional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        const file = e.target.files[0];
                        setImageFile(file);
                        const url = URL.createObjectURL(file);
                        setImage(url);
                      }
                    }}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              )}
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del producto *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3">
                    {form.name}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo *
                </label>
                {isEditing ? (
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="producto">Producto</option>
                    <option value="servicio">Servicio</option>
                  </select>
                ) : (
                  <div className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3">
                    {form.type === "servicio" ? "Servicio" : "Producto"}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="sku"
                    value={form.sku || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3">
                    {form.sku || "—"}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de barras
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="barcode"
                    value={form.barcode || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3">
                    {form.barcode || "—"}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="category"
                    value={form.category || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3">
                    {form.category || "—"}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marca
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="brand"
                    value={form.brand || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3">
                    {form.brand || "—"}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                {isEditing ? (
                  <textarea
                    name="description"
                    value={form.description || ""}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 min-h-[80px]">
                    {form.description || "—"}
                  </div>
                )}
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
                {isEditing ? (
                  <input
                    type="number"
                    name="price"
                    value={form.price ?? ""}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 font-semibold text-green-600">
                    {form.price != null ? formatCurrency(form.price) : "—"}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Costo
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="cost"
                    value={form.cost ?? ""}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3">
                    {form.cost != null ? formatCurrency(form.cost) : "—"}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock actual
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="stock"
                    value={form.stock ?? ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div
                    className={`w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 ${
                      (form.stock || 0) <= (form.minimumQuantity || 5)
                        ? "text-red-600 font-semibold"
                        : "text-gray-800"
                    }`}
                  >
                    {form.stock ?? "0"}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad mínima
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="minimumQuantity"
                    value={form.minimumQuantity ?? ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3">
                    {form.minimumQuantity ?? "—"}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidad de venta
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="saleUnit"
                    value={form.saleUnit || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3">
                    {form.saleUnit || "—"}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación en almacén
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    value={form.location || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3">
                    {form.location || "—"}
                  </div>
                )}
              </div>
              {/* Checkboxes */}
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
                    {isEditing ? (
                      <input
                        type="checkbox"
                        name={field.name}
                        checked={Boolean(form[field.name as keyof Product])}
                        onChange={handleChange}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={Boolean(form[field.name as keyof Product])}
                        disabled
                        className="w-5 h-5 text-gray-400 rounded focus:ring-gray-300"
                      />
                    )}
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
                {isEditing ? (
                  <input
                    type="text"
                    name="satKey"
                    value={form.satKey || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3">
                    {form.satKey || "—"}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clave SAT (Unidad)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="satUnitKey"
                    value={form.satUnitKey || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3">
                    {form.satUnitKey || "—"}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IVA (%)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="iva"
                    value={form.iva ?? ""}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3">
                    {form.iva ?? "—"}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IEPS (%)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="ieps"
                    value={form.ieps ?? ""}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3">
                    {form.ieps ?? "—"}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 pt-2">
                {isEditing ? (
                  <input
                    type="checkbox"
                    name="ivaIncluded"
                    checked={Boolean(form.ivaIncluded)}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                ) : (
                  <input
                    type="checkbox"
                    checked={Boolean(form.ivaIncluded)}
                    disabled
                    className="w-5 h-5 text-gray-400 rounded focus:ring-gray-300"
                  />
                )}
                <label className="text-sm font-medium text-gray-700">
                  Precio incluye IVA
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Variantes (solo en modo edición) */}
        {isEditing && (
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
            {form.variants && form.variants.length > 0 ? (
              <div className="space-y-3">
                {form.variants.map((variant, index) => (
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
        )}

        {/* Listas de Precios (solo en modo edición) */}
        {isEditing && (
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
            {form.priceLists && form.priceLists.length > 0 ? (
              <div className="space-y-3">
                {form.priceLists.map((priceList, index) => (
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
        )}
      </form>
    </div>
  );
}
