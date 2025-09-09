// app/dashboard/invoices/create/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Product } from "@/types/product";
import { Customer } from "@/types/customer";
import { Sale, SaleItem } from "@/types/sale";
import { CreateInvoiceRequest } from "@/types/invoice";

// Interfaz local para los items del formulario
interface InvoiceItemForm {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  satProductKey?: string;
  satUnitKey?: string;
}

export default function CreateInvoice() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const saleId = searchParams.get("saleId");

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sale, setSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<InvoiceItemForm[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("PUE");
  const [paymentForm, setPaymentForm] = useState("01");
  const [cfdiUse, setCfdiUse] = useState("G03");
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

        if (!productsRes.ok) throw new Error("Error cargando productos");
        if (!customersRes.ok) throw new Error("Error cargando clientes");

        const productsData = await productsRes.json();
        const customersData = await customersRes.json();

        setProducts(productsData.products || []);
        setCustomers(customersData.customers || []);

        // Si hay saleId, cargar la venta
        if (saleId) {
          const saleRes = await fetch(`/api/sales/${saleId}`, {
            credentials: "include",
          });
          if (saleRes.ok) {
            const saleData = await saleRes.json();
            setSale(saleData.sale);
            setSelectedCustomer(saleData.sale.customerId);

            // Convertir items de venta a items de factura usando tipos correctos
            setItems(
              saleData.sale.saleItems.map(
                (item: SaleItem & { product?: { name: string } }) => ({
                  productId: item.productId,
                  description: item.product?.name || item.description || "",
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  totalPrice: item.totalPrice,
                  satProductKey: item.satProductKey || "",
                  satUnitKey: item.satUnitKey || "",
                })
              )
            );
          }
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError("Error al cargar los datos necesarios");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [saleId]);

  const addItem = () => {
    setItems([
      ...items,
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        satProductKey: "",
        satUnitKey: "",
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

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setItems((prevItems) => {
        const newItems = [...prevItems];
        newItems[index] = {
          ...newItems[index],
          productId: productId,
          description: product.name,
          unitPrice: product.price || 0,
          totalPrice: newItems[index].quantity * (product.price || 0),
          satProductKey: product.satKey || "",
          satUnitKey: product.satUnitKey || "",
        };
        return newItems;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer) {
      setError("Selecciona un cliente");
      return;
    }

    if (items.length === 0) {
      setError("Agrega al menos un item a la factura");
      return;
    }

    // Validar que todos los items tengan descripción
    const hasEmptyDescriptions = items.some((item) => !item.description.trim());
    if (hasEmptyDescriptions) {
      setError("Todos los items deben tener una descripción");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const invoiceData: CreateInvoiceRequest = {
        saleId: saleId || undefined,
        customerId: selectedCustomer,
        invoiceItems: items.map((item) => ({
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          satProductKey: item.satProductKey,
          satUnitKey: item.satUnitKey,
        })),
        paymentMethod,
        paymentForm,
        cfdiUse,
        currency: "MXN",
      };

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
        credentials: "include",
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Error al crear la factura");
      }

      router.push("/dashboard/invoices");
    } catch (err) {
      console.error("Error creando factura:", err);
      setError(
        err instanceof Error ? err.message : "Error al crear la factura"
      );
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxes = totalAmount * 0.16;
  const total = totalAmount + taxes;

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
        <h1 className="text-2xl font-bold text-gray-800">
          {saleId ? "Facturar Venta" : "Nueva Factura Directa"}
        </h1>
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
        {/* Información general */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente *
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={!!saleId} // Deshabilitar si es desde venta
            >
              <option value="">Seleccionar cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} {customer.rfc && `(${customer.rfc})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forma de Pago *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="PUE">Pago en una sola exhibición</option>
              <option value="PPD">Pago en parcialidades o diferido</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Uso CFDI *
            </label>
            <select
              value={cfdiUse}
              onChange={(e) => setCfdiUse(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="G03">G03 - Gastos en general</option>
              <option value="P01">P01 - Por definir</option>
              <option value="G01">G01 - Adquisición de mercancías</option>
              <option value="G02">
                G02 - Devoluciones, descuentos o bonificaciones
              </option>
            </select>
          </div>
        </div>

        {/* Items de la factura */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Productos/Servicios
            </h2>
            <button
              type="button"
              onClick={addItem}
              className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors"
            >
              + Agregar Item
            </button>
          </div>

          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-3 mb-4 p-4 border rounded-lg"
            >
              <div className="col-span-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción *
                </label>
                {saleId ? (
                  <input
                    type="text"
                    value={item.description}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
                    readOnly
                  />
                ) : (
                  <>
                    <select
                      value={item.productId || ""}
                      onChange={(e) =>
                        handleProductChange(index, e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                    >
                      <option value="">Seleccionar producto</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} {product.sku && `(${product.sku})`}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(index, "description", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descripción del item"
                      required
                    />
                  </>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
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

              {/* Campos SAT */}
              <div className="col-span-12 grid grid-cols-2 gap-3 mt-3">
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
              </div>
            </div>
          ))}
        </div>

        {/* Totales */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-2 gap-4 max-w-md ml-auto">
            <div className="text-right font-semibold">Subtotal:</div>
            <div className="text-right">${totalAmount.toFixed(2)}</div>

            <div className="text-right font-semibold">IVA (16%):</div>
            <div className="text-right">${taxes.toFixed(2)}</div>

            <div className="text-right font-bold text-lg border-t pt-2">
              Total:
            </div>
            <div className="text-right font-bold text-lg border-t pt-2">
              ${total.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Botones */}
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
            {loading ? "Procesando..." : "Crear Factura"}
          </button>
        </div>
      </form>
    </div>
  );
}
