"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Product, QuotationItem } from "@/types/product";
import { Customer } from "@/types/customer";
import { toast } from "react-hot-toast";

const IVA_PERCENTAGE = 0.16;

// Typing for the data payload returned by our GET quotation API
interface QuotationDataResponse {
  customerId?: string;
  expiryDate?: string;
  notes?: string;
  quotationItems?: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    satProductKey?: string;
    satUnitKey?: string;
    description?: string;
    product?: {
      description?: string;
    };
  }>;
}

export default function EditQuotation() {
  const router = useRouter();
  const params = useParams();
  const quotationId = params.id as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const totalAmountWithoutIVA = items.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );
  const ivaAmount = totalAmountWithoutIVA * IVA_PERCENTAGE;
  const totalAmountWithIVA = totalAmountWithoutIVA * (1 + IVA_PERCENTAGE);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [productsRes, customersRes, quotationRes] = await Promise.all([
        fetch("/api/products", { credentials: "include" }),
        fetch("/api/customers", { credentials: "include" }),
        fetch(`/api/quotations/${quotationId}`, { credentials: "include" })
      ]);

      if (!productsRes.ok || !customersRes.ok || !quotationRes.ok) {
        throw new Error("Error al cargar los datos necesarios");
      }

      const productsData = await productsRes.json();
      const customersData = await customersRes.json();
      const quotationData = await quotationRes.json();

      setProducts(productsData.products || []);
      setCustomers(customersData.customers || []);

      const q: QuotationDataResponse = quotationData.quotation;
      if (q) {
        setSelectedCustomer(q.customerId || "");
        if (q.expiryDate) {
          setExpiryDate(new Date(q.expiryDate).toISOString().split("T")[0]);
        }
        setNotes(q.notes || "");
        
        if (q.quotationItems && q.quotationItems.length > 0) {
          setItems(
            q.quotationItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              satProductKey: item.satProductKey || "",
              satUnitKey: item.satUnitKey || "",
              description: item.description || item.product?.description || "",
            }))
          );
        }
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
      setError("Error al cargar los datos necesarios");
      toast.error("No se pudieron cargar productos o clientes");
    } finally {
      setIsLoading(false);
    }
  }, [quotationId]);

  useEffect(() => {
    if (quotationId) {
      fetchData();
    }
  }, [quotationId, fetchData]);

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

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    const price = product?.price || 0;

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
      toast.error("Por favor selecciona un cliente");
      return;
    }

    if (items.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }

    const hasEmptyProducts = items.some((item) => !item.productId);
    if (hasEmptyProducts) {
      toast.error("Todos los productos deben estar seleccionados");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const quotationData = {
        customerId: selectedCustomer,
        expiryDate: expiryDate || undefined,
        quotationItems: items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          satProductKey: item.satProductKey,
          satUnitKey: item.satUnitKey,
          description: item.description,
        })),
        notes,
      };

      const res = await fetch(`/api/quotations/${quotationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quotationData),
        credentials: "include",
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Error al actualizar la cotización");
      }

      toast.success("Cotización actualizada exitosamente");
      router.push(`/dashboard/sales/quotation`);
    } catch (err) {
      console.error("Error actualizando cotización:", err);
      const message =
        err instanceof Error ? err.message : "Error al actualizar la cotización";
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Editar Cotización</h1>
          <p className="text-gray-600 mt-1">
            Modifica los campos de la cotización
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl font-semibold shadow hover:shadow-md transition-all duration-200 flex items-center gap-2"
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
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Selección de cliente */}
          <div>
            <label className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Cliente
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              required
            >
              <option value="">Selecciona un cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha de vencimiento */}
          <div>
            <label className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg
                className="w-6 h-6 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Fecha de Vencimiento (Opcional)
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>

          {/* Productos */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
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
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow hover:shadow-md transition-all duration-200 flex items-center gap-2"
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
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-2xl">
                No hay productos agregados
              </div>
            )}

            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 p-5 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-gray-200"
              >
                <div className="md:col-span-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Producto *
                  </label>
                  <select
                    value={item.productId}
                    onChange={(e) => handleProductChange(index, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar producto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} {product.sku && `(${product.sku})`}
                        {product.price && ` - ${formatCurrency(product.price)}`}
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
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, "quantity", Number(e.target.value))
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Unitario *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.000001"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(index, "unitPrice", Number(e.target.value))
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total
                  </label>
                  <input
                    type="text"
                    value={formatCurrency(item.totalPrice)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-100"
                    readOnly
                  />
                </div>

                <div className="md:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full flex items-center justify-center hover:shadow-md transition-all duration-200"
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

                {/* Campos SAT */}
                <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Clave Producto SAT
                    </label>
                    <input
                      type="text"
                      value={item.satProductKey || ""}
                      onChange={(e) =>
                        updateItem(index, "satProductKey", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Clave SAT"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Clave Unidad SAT
                    </label>
                    <input
                      type="text"
                      value={item.satUnitKey || ""}
                      onChange={(e) =>
                        updateItem(index, "satUnitKey", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Clave unidad"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={item.description || ""}
                      onChange={(e) =>
                        updateItem(index, "description", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descripción para factura"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Notas */}
          <div>
            <label className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
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
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              rows={3}
              placeholder="Ej: Descuentos especiales, condiciones, etc."
            />
          </div>

          {/* Total y botones */}
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4">
                  <div>
                    <p className="text-lg text-gray-700">Subtotal (sin IVA)</p>
                  </div>
                  <div className="text-2xl font-bold text-gray-700">
                    {formatCurrency(totalAmountWithoutIVA)}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4">
                  <div>
                    <p className="text-lg text-gray-700">IVA (16%)</p>
                  </div>
                  <div className="text-2xl font-bold text-amber-600">
                    {formatCurrency(ivaAmount)}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 border-t border-gray-300 pt-4">
                  <div>
                    <p className="text-lg font-semibold text-gray-800">
                      Total (con IVA)
                    </p>
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(totalAmountWithIVA)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-semibold shadow hover:shadow-md transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || items.length === 0 || !selectedCustomer}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
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
                  </span>
                ) : (
                  "Guardar Cambios"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
