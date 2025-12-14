// src/app/dashboard/purchases/create/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PurchaseItemRequest } from "@/types/purchase";
import { Product } from "@/types/product";
import { toast } from "react-hot-toast";

interface PurchaseItem extends PurchaseItemRequest {
  totalPrice: number;
}

export default function CreatePurchase() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supplierId = searchParams.get("supplierId");

  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products", { credentials: "include" });
        if (!res.ok) throw new Error("Error al cargar productos");
        const data = await res.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Error al cargar los productos");
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  const addItem = () => {
    setItems([
      ...items,
      { productId: "", quantity: 0, unitPrice: 0, totalPrice: 0 },
    ]);
  };

  const updateItem = (index: number, field: string, value: unknown) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "quantity" || field === "unitPrice") {
      newItems[index].totalPrice =
        Number(newItems[index].quantity) * Number(newItems[index].unitPrice);
    }

    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId) {
      toast.error("Debes seleccionar un proveedor antes de crear la compra");
      return;
    }

    if (items.length === 0) {
      toast.error("Agrega al menos un producto a la compra");
      return;
    }

    const hasEmptyProduct = items.some((item) => !item.productId);
    if (hasEmptyProduct) {
      toast.error("Todos los productos deben estar seleccionados");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId, items, notes }),
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Compra registrada exitosamente");
        router.push("/dashboard/purchases");
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error desconocido");
      }
    } catch (error) {
      console.error("Error creating purchase:", error);
      const message =
        error instanceof Error ? error.message : "Error de conexión";
      toast.error(`Error al crear la compra: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const purchasableProducts = products.filter(
    (product) => product.type === "producto"
  );

  if (loadingProducts && products.length === 0) {
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Realizar Compra</h1>
          <p className="text-gray-600 mt-1">
            Registra una nueva compra a proveedor
          </p>
        </div>

        <button
          type="button"
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

      {/* Advertencia si no hay proveedor */}
      {!supplierId && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 text-yellow-700 px-6 py-4 rounded-2xl mx-4 sm:mx-6 lg:mx-8">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-yellow-500"
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
            <p>⚠️ Debes seleccionar un proveedor antes de crear una compra.</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/suppliers")}
            className="mt-3 bg-gradient-to-r from-yellow-600 to-amber-600 text-white px-5 py-2.5 rounded-lg font-medium shadow hover:shadow-md transition-all"
          >
            Seleccionar Proveedor
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mx-4 sm:mx-6 lg:mx-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Notas */}
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-4 flex items-center gap-3">
              <svg
                className="w-6 h-6 text-purple-600"
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
              Notas (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Notas adicionales sobre la compra..."
            />
          </div>

          {/* Productos */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                Productos ({items.length})
              </h2>
              <button
                type="button"
                onClick={addItem}
                disabled={!supplierId}
                className={`px-5 py-2.5 rounded-xl font-medium shadow hover:shadow-md transition-all ${
                  !supplierId
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                }`}
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
                Agregar Producto
              </button>
            </div>

            {items.length === 0 && (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
                No hay productos agregados
              </div>
            )}

            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 p-5 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200"
              >
                <div className="md:col-span-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Producto *
                  </label>
                  <select
                    value={item.productId}
                    onChange={(e) =>
                      updateItem(index, "productId", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={!supplierId}
                  >
                    <option value="">Seleccionar producto</option>
                    {purchasableProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} {product.sku && `(${product.sku})`}
                        {product.stock !== undefined &&
                          ` - Stock: ${product.stock}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, "quantity", Number(e.target.value))
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={!supplierId}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Unitario *
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(index, "unitPrice", Number(e.target.value))
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={!supplierId}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total
                  </label>
                  <input
                    type="text"
                    value={new Intl.NumberFormat("es-MX", {
                      style: "currency",
                      currency: "MXN",
                    }).format(item.totalPrice)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-100"
                    readOnly
                  />
                </div>

                <div className="md:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={!supplierId}
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      !supplierId
                        ? "bg-gray-300 text-gray-500"
                        : "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:shadow-md"
                    } transition-all`}
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
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total y botones */}
          {items.length > 0 && (
            <div className="pt-6 border-t border-gray-200">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4">
                  <div>
                    <p className="text-lg text-gray-700">Total de la Compra</p>
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {new Intl.NumberFormat("es-MX", {
                      style: "currency",
                      currency: "MXN",
                    }).format(totalAmount)}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-semibold shadow hover:shadow-md transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || items.length === 0 || !supplierId}
                  className={`px-6 py-3 rounded-xl font-semibold shadow hover:shadow-md transition-all flex items-center gap-2 ${
                    loading || items.length === 0 || !supplierId
                      ? "bg-blue-400 text-white cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                  }`}
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
                      Procesando...
                    </>
                  ) : (
                    "Registrar Compra"
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
