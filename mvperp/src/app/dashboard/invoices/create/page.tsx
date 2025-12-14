// app/dashboard/invoices/create/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex justify-center items-center">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl border border-gray-200 shadow-sm text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">
            Cargando datos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="pt-8 pb-8 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-b-2xl shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2 leading-tight">
                {saleId ? "Facturar Venta" : "Nueva Factura"}
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl">
                {saleId
                  ? "Genera la factura para esta venta"
                  : "Crea una factura directa para tu cliente"}
              </p>
            </div>
            <Link
              href="/dashboard/invoices"
              className="mt-4 md:mt-0 bg-transparent border-2 border-white text-white px-6 py-2 rounded-lg font-semibold hover:bg-white/10 transition-all duration-200"
            >
              ← Volver
            </Link>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="text-2xl bg-white p-3 rounded-xl shadow-sm">
                  ⚠️
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-800 mb-1">
                    Error
                  </h3>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Información del Cliente */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-gray-200 shadow-sm">
            <div className="flex items-start space-x-6 mb-6">
              <div className="text-4xl bg-white p-4 rounded-xl shadow-sm">
                👤
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  Información del Cliente
                </h2>
                <p className="text-gray-600 mb-6">
                  Datos del cliente para facturación
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                  required
                  disabled={!!saleId}
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
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                  required
                >
                  <option value="PUE">Pago en una sola exhibición</option>
                  <option value="PPD">Pago en parcialidades o diferido</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pago *
                </label>
                <select
                  value={paymentForm}
                  onChange={(e) => setPaymentForm(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                  required
                >
                  <option value="01">Efectivo</option>
                  <option value="02">Cheque</option>
                  <option value="03">Transferencia</option>
                  <option value="04">Tarjeta de crédito</option>
                  <option value="05">Tarjeta de débito</option>
                  <option value="06">Aplicación de anticipos</option>
                  <option value="08">Vales de despensa</option>
                  <option value="28">Tarjeta de servicio</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Uso CFDI *
                </label>
                <select
                  value={cfdiUse}
                  onChange={(e) => setCfdiUse(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                  required
                >
                  <option value="G03">G03 - Gastos en general</option>
                  <option value="P01">P01 - Por definir</option>
                  <option value="G01">G01 - Adquisición de mercancías</option>
                  <option value="G02">
                    G02 - Devoluciones, descuentos o bonificaciones
                  </option>
                  <option value="S01">S01 - Sin efectos fiscales</option>
                </select>
              </div>
            </div>
          </div>

          {/* Productos y Servicios */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-gray-200 shadow-sm">
            <div className="flex items-start space-x-6 mb-6">
              <div className="text-4xl bg-white p-4 rounded-xl shadow-sm">
                📦
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    Productos / Servicios
                  </h2>
                  <button
                    type="button"
                    onClick={addItem}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
                  >
                    <span className="mr-2">+</span>
                    Agregar Item
                  </button>
                </div>
                <p className="text-gray-600 mb-6">
                  Agrega los productos o servicios a facturar
                </p>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-gray-500 mb-4">No hay items en la factura</p>
                <p className="text-sm text-gray-400">
                  Agrega productos o servicios para continuar
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm"
                  >
                    <div className="grid grid-cols-12 gap-4 mb-4">
                      <div className="col-span-12 lg:col-span-5">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Descripción *
                        </label>
                        {saleId ? (
                          <input
                            type="text"
                            value={item.description}
                            className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50"
                            readOnly
                          />
                        ) : (
                          <>
                            <select
                              value={item.productId || ""}
                              onChange={(e) =>
                                handleProductChange(index, e.target.value)
                              }
                              className="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 mb-2"
                            >
                              <option value="">Seleccionar producto</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name}{" "}
                                  {product.sku && `(${product.sku})`}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) =>
                                updateItem(index, "description", e.target.value)
                              }
                              className="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                              placeholder="Descripción del item"
                              required
                            />
                          </>
                        )}
                      </div>

                      <div className="col-span-6 lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cantidad *
                        </label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "quantity",
                              Number(e.target.value)
                            )
                          }
                          className="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                          required
                        />
                      </div>

                      <div className="col-span-6 lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Precio Unitario *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "unitPrice",
                              Number(e.target.value)
                            )
                          }
                          className="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                          required
                        />
                      </div>

                      <div className="col-span-8 lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Total
                        </label>
                        <div className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 font-semibold text-gray-800">
                          ${item.totalPrice.toFixed(2)}
                        </div>
                      </div>

                      <div className="col-span-4 lg:col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-3 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 w-full flex items-center justify-center"
                          title="Eliminar item"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Campos SAT */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
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
                          className="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
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
                          className="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                          placeholder="Clave unidad"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resumen de Totales */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-gray-200 shadow-sm">
            <div className="flex items-start space-x-6 mb-6">
              <div className="text-4xl bg-white p-4 rounded-xl shadow-sm">
                💰
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  Resumen de Totales
                </h2>
                <p className="text-gray-600 mb-6">
                  Resumen del importe de la factura
                </p>
              </div>
            </div>

            <div className="max-w-md ml-auto">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="text-xl font-semibold text-gray-800">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">IVA (16%):</span>
                  <span className="text-xl font-semibold text-gray-800">
                    ${taxes.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-gray-300 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-gray-900">
                      Total:
                    </span>
                    <span className="text-3xl font-bold text-blue-600">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-4">
            <Link
              href="/dashboard/invoices"
              className="bg-transparent border-2 border-gray-300 text-gray-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading || items.length === 0 || !selectedCustomer}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
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
                "Crear Factura"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
