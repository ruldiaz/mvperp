// src/app/dashboard/purchases/create/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PurchaseItemRequest } from "@/types/purchase";
import { Product } from "@/types/product";

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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products", { credentials: "include" });
        if (!res.ok) throw new Error("Error al cargar productos");
        const data = await res.json();
        setProducts(data.products);
      } catch (error) {
        console.error("Error fetching products:", error);
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
        newItems[index].quantity * newItems[index].unitPrice;
    }

    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId, items, notes }),
        credentials: "include",
      });

      if (res.ok) {
        router.push("/dashboard/purchases");
      } else {
        const errorData = await res.json();
        console.error("Error creating purchase:", errorData);
        alert(
          "Error al crear la compra: " +
            (errorData.error || "Error desconocido")
        );
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Error de conexión al crear la compra");
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const purchasableProducts = products.filter(
    (product) => product.type === "producto"
  );

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Realizar Compra</h1>

      {!supplierId && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>⚠️ Debe seleccionar un proveedor antes de crear una compra.</p>
          <button
            onClick={() => router.push("/dashboard/suppliers")}
            className="mt-2 bg-yellow-600 text-white px-3 py-1 rounded text-sm"
          >
            Seleccionar Proveedor
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Notas</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border p-2 rounded"
            rows={3}
            placeholder="Notas adicionales sobre la compra..."
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Productos</h2>
            <button
              type="button"
              onClick={addItem}
              className="bg-green-600 text-white px-3 py-1 rounded"
              disabled={!supplierId}
            >
              + Agregar Producto
            </button>
          </div>

          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-end">
              <div className="col-span-5">
                <label className="block text-sm font-medium mb-1">
                  Producto
                </label>
                <select
                  value={item.productId}
                  onChange={(e) =>
                    updateItem(index, "productId", e.target.value)
                  }
                  className="w-full border p-2 rounded"
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

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, "quantity", Number(e.target.value))
                  }
                  className="w-full border p-2 rounded"
                  required
                  disabled={!supplierId}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Precio Unitario
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateItem(index, "unitPrice", Number(e.target.value))
                  }
                  className="w-full border p-2 rounded"
                  required
                  disabled={!supplierId}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Total</label>
                <input
                  type="text"
                  value={item.totalPrice.toLocaleString("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  })}
                  className="w-full border p-2 rounded bg-gray-100"
                  readOnly
                />
              </div>

              <div className="col-span-1">
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="bg-red-600 text-white p-2 rounded w-full"
                  disabled={!supplierId}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total de la Compra:</span>
              <span className="text-xl font-bold">
                {totalAmount.toLocaleString("es-MX", {
                  style: "currency",
                  currency: "MXN",
                })}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || items.length === 0 || !supplierId}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-400"
          >
            {loading ? "Procesando..." : "Registrar Compra"}
          </button>
        </div>
      </form>
    </div>
  );
}
