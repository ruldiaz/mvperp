// src/app/dashboard/sales/create/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";
import { Customer } from "@/types/customer";
import { SaleItem } from "@/types/sale";

export default function CreateSale() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [productsRes, customersRes] = await Promise.all([
          fetch("/api/products", { credentials: "include" }),
          fetch("/api/customers", { credentials: "include" }),
        ]);

        if (!productsRes.ok) {
          throw new Error(`Error productos: ${productsRes.status}`);
        }
        if (!customersRes.ok) {
          throw new Error(`Error clientes: ${customersRes.status}`);
        }

        const productsData = await productsRes.json();
        const customersData = await customersRes.json();

        setProducts(productsData.products || []);
        setCustomers(customersData.customers || []);
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError("Error al cargar los datos necesarios");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: "",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        satProductKey: "",
        satUnitKey: "",
        description: "",
      },
    ]);
  };

  const updateItem = (index: number, field: string, value: unknown) => {
    setItems((prevItems) => {
      const newItems = [...prevItems];
      newItems[index] = { ...newItems[index], [field]: value };

      // Calcular totalPrice si cambia quantity o unitPrice
      if (field === "quantity" || field === "unitPrice") {
        const quantity = Number(newItems[index].quantity);
        const unitPrice = Number(newItems[index].unitPrice);
        newItems[index].totalPrice = quantity * unitPrice;
      }

      return newItems;
    });
  };

  const removeItem = (index: number) => {
    setItems((prevItems) => prevItems.filter((_, i) => i !== index));
  };

  const getProductPrice = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product?.price || 0;
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    const price = product?.price || 0;

    // Actualizar campos con información del producto
    setItems((prevItems) => {
      const newItems = [...prevItems];
      newItems[index] = {
        ...newItems[index],
        productId: productId,
        unitPrice: price,
        totalPrice: newItems[index].quantity * price,
        satProductKey: product?.satKey || "",
        satUnitKey: product?.satUnitKey || "",
        description: product?.name || "",
      };
      return newItems;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer) {
      setError("Selecciona un cliente");
      return;
    }

    if (items.length === 0) {
      setError("Agrega al menos un producto");
      return;
    }

    // Validar que todos los productos estén seleccionados
    const hasEmptyProducts = items.some((item) => !item.productId);
    if (hasEmptyProducts) {
      setError("Todos los productos deben estar seleccionados");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const saleData = {
        customerId: selectedCustomer,
        saleItems: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          satProductKey: item.satProductKey,
          satUnitKey: item.satUnitKey,
          description: item.description,
        })),
        notes,
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
        credentials: "include",
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Error al crear la venta");
      }

      router.push("/dashboard/sales");
    } catch (err) {
      console.error("Error creando venta:", err);
      setError(err instanceof Error ? err.message : "Error al crear la venta");
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex justify-center items-center h-64">
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Nueva Venta</h1>
        <button
          onClick={() => router.back()}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Cancelar
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selección de cliente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cliente *
          </label>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Seleccionar cliente</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>

        {/* Productos */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Productos</h2>
            <button
              type="button"
              onClick={addItem}
              className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors"
            >
              + Agregar Producto
            </button>
          </div>

          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-3 mb-4 p-4 border rounded-lg"
            >
              <div className="col-span-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Producto *
                </label>
                <select
                  value={item.productId}
                  onChange={(e) => handleProductChange(index, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar producto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} {product.sku && `(${product.sku})`}
                      {product.stock !== undefined &&
                        ` - Stock: ${product.stock}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, "quantity", Number(e.target.value))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Unitario *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateItem(index, "unitPrice", Number(e.target.value))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total
                </label>
                <input
                  type="number"
                  value={item.totalPrice.toFixed(2)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
                  readOnly
                />
              </div>

              <div className="col-span-1 flex items-end">
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Campos SAT para cada producto */}
              <div className="col-span-12 grid grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clave Producto SAT
                  </label>
                  <input
                    type="text"
                    value={item.satProductKey || ""}
                    onChange={(e) =>
                      updateItem(index, "satProductKey", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Clave SAT"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clave Unidad SAT
                  </label>
                  <input
                    type="text"
                    value={item.satUnitKey || ""}
                    onChange={(e) =>
                      updateItem(index, "satUnitKey", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Clave unidad"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={item.description || ""}
                    onChange={(e) =>
                      updateItem(index, "description", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descripción para factura"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Notas adicionales sobre la venta..."
          />
        </div>

        {/* Total y botones */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-6">
            <span className="text-lg font-semibold">Total de la Venta:</span>
            <span className="text-2xl font-bold text-green-600">
              ${totalAmount.toFixed(2)}
            </span>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || items.length === 0 || !selectedCustomer}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? "Procesando..." : "Crear Venta"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
